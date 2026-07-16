package alerts

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"reflecto.trend/handler"
	"reflecto.trend/models"
	"reflecto.trend/utils"
	"strings"
	"sync"
	"text/template"
	"time"
)

type binancePrice struct {
	Symbol string `json:"symbol"`
	Price  string `json:"price"`
}

func StartAlertWorker(env *handler.Env) {
	go func() {
		log.Println("Alert worker: starting")
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Alert worker panic: %v\n", r)
			}
		}()

		ticker := time.NewTicker(60 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			evaluateAlerts(env)
		}
	}()
}

func evaluateAlerts(env *handler.Env) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Alert worker panic in evaluation: %v\n", r)
		}
	}()

	alerts, err := env.DB.ListActiveAlerts()
	if err != nil {
		log.Printf("Alert worker: error listing active alerts: %v\n", err)
		return
	}
	if len(alerts) == 0 {
		return
	}

	symbols := uniqueSymbols(alerts)

	prices, err := fetchBinancePrices(symbols)
	if err != nil {
		log.Printf("Alert worker: error fetching prices: %v\n", err)
		return
	}

	triggeredCount := 0
	for _, a := range alerts {
		currentPrice, ok := prices[a.Symbol]
		if !ok {
			continue
		}
		didTrigger, err := evaluateAlert(env, a, currentPrice)
		if err != nil {
			log.Printf("Alert worker: error evaluating alert %d: %v\n", a.ID, err)
			continue
		}
		if didTrigger {
			triggeredCount++
		}
	}

	log.Printf("Alert worker: evaluated %d alerts, %d triggered\n", len(alerts), triggeredCount)
}

func uniqueSymbols(alerts []models.Alert) []binanceSymbolMap {
	seen := make(map[string]bool)
	var symbols []binanceSymbolMap
	for _, a := range alerts {
		if !seen[a.Symbol] {
			seen[a.Symbol] = true
			symbols = append(symbols, binanceSymbolMap{
				original: a.Symbol,
				binance:  strings.ReplaceAll(a.Symbol, "-", ""),
			})
		}
	}
	return symbols
}

type binanceSymbolMap struct {
	original string
	binance  string
}

func fetchBinancePrices(symbols []binanceSymbolMap) (map[string]float64, error) {
	binanceSymbols := make([]string, len(symbols))
	for i, s := range symbols {
		binanceSymbols[i] = s.binance
	}

	url := "https://api.binance.com/api/v3/ticker/price"
	if len(binanceSymbols) > 0 {
		symbolsJSON, _ := json.Marshal(binanceSymbols)
		url = url + "?symbols=" + string(symbolsJSON)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("binance request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		return nil, fmt.Errorf("binance rate limited (429)")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("binance returned status %d", resp.StatusCode)
	}

	var prices []binancePrice
	if err := json.NewDecoder(resp.Body).Decode(&prices); err != nil {
		return nil, fmt.Errorf("binance decode failed: %w", err)
	}

	priceByOriginal := make(map[string]float64, len(prices))
	for _, bp := range prices {
		price := 0.0
		if _, err := fmt.Sscanf(bp.Price, "%f", &price); err != nil {
			continue
		}
		for _, s := range symbols {
			if s.binance == bp.Symbol {
				priceByOriginal[s.original] = price
				break
			}
		}
	}
	return priceByOriginal, nil
}

type alertState struct {
	mu        sync.Mutex
	lastPrice map[int]float64
}

var globalAlertState = &alertState{lastPrice: make(map[int]float64)}

func evaluateAlert(env *handler.Env, a models.Alert, currentPrice float64) (bool, error) {
	globalAlertState.mu.Lock()
	lastPrice, hasLast := globalAlertState.lastPrice[a.ID]
	globalAlertState.lastPrice[a.ID] = currentPrice
	globalAlertState.mu.Unlock()

	if !hasLast {
		return false, nil
	}

	triggered := false

	switch a.Condition {
	case "above":
		if currentPrice >= a.TargetValue && lastPrice < a.TargetValue {
			triggered = true
		}
	case "below":
		if currentPrice <= a.TargetValue && lastPrice > a.TargetValue {
			triggered = true
		}
	case "pct_change":
		if a.WindowMinutes != nil && *a.WindowMinutes > 0 {
			change := (currentPrice - lastPrice) / lastPrice * 100
			if change < 0 {
				change = -change
			}
			if change >= a.TargetValue {
				triggered = true
			}
		}
	}

	if triggered {
		if err := triggerAlert(env, a, currentPrice); err != nil {
			return false, err
		}
	}

	return triggered, nil
}

func triggerAlert(env *handler.Env, a models.Alert, currentPrice float64) error {
	newStatus := "triggered"
	if a.Repeat != 0 {
		newStatus = "active"
	}

	if err := env.DB.UpdateAlertStatus(a.ID, newStatus); err != nil {
		return fmt.Errorf("failed to update alert status: %w", err)
	}

	go sendAlertNotification(env, a, currentPrice)

	return nil
}

func sendAlertNotification(env *handler.Env, a models.Alert, currentPrice float64) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Alert notification panic for alert %d: %v\n", a.ID, r)
		}
	}()

	conditionLabel := map[string]string{
		"above":      "Price Above",
		"below":      "Price Below",
		"pct_change": "Percent Change",
	}

	data := models.EmailData{
		UnsubscribeLink:   "https://" + os.Getenv("DOMAIN") + "/unsubscribe",
		ProductUrl:        "https://" + os.Getenv("DOMAIN") + "/",
		AlertSymbol:       a.Symbol,
		AlertCondition:    conditionLabel[a.Condition],
		AlertTarget:       fmt.Sprintf("$%.2f", a.TargetValue),
		AlertCurrentPrice: fmt.Sprintf("$%.2f", currentPrice),
		AlertTime:         time.Now().UTC().Format("2006-01-02 15:04:05 UTC"),
	}

	subject := fmt.Sprintf("Alert: %s %s at $%.2f", a.Symbol, a.Condition, currentPrice)

	currentDir, _ := os.Getwd()
	templateFile := currentDir + "/email-templates/alert-triggered.html"

	t, err := template.ParseFiles(templateFile)
	if err != nil {
		log.Printf("Error parsing alert email template: %v\n", err)
		return
	}

	var body bytes.Buffer
	if err := t.Execute(&body, data); err != nil {
		log.Printf("Error executing alert email template: %v\n", err)
		return
	}

	if err := utils.SendEmail(a.UserEmail, data, subject, templateFile); err != nil {
		log.Printf("Error sending alert email to %s: %v\n", a.UserEmail, err)
	}
}
