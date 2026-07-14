package shares

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"reflecto.trend/handler"
	"strings"
	"time"
	"path/filepath"

	"github.com/julienschmidt/httprouter"
)

// writeJSONError writes a JSON error body of the form {"error": "..."} with
// the given status code, instead of the plain-text bodies http.Error produces.
func writeJSONError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(map[string]string{"error": message}); err != nil {
		log.Printf("Error encoding error response: %v\n", err)
	}
}

func HandleTrends(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Cache-Control", "public, max-age=300")

		dir, err := os.Getwd()
		if err != nil {
			writeJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}

		filePath := filepath.Join(dir, "coingecko/trending-coins.json")

		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("[]"))
			return
		}

		data, err := os.ReadFile(filePath)
		if err != nil {
			writeJSONError(w, "Failed to read trending data", http.StatusInternalServerError)
			return
		}

		if len(data) == 0 {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("[]"))
			return
		}

		if !json.Valid(data) {
			writeJSONError(w, "Invalid JSON data", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write(data)
	}
}

func HandleAnalyse(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		if r.Method == http.MethodOptions {
			return
		}

		email := r.Context().Value("email").(string)

		defer r.Body.Close()

		body, err := io.ReadAll(r.Body)
		if err != nil {
			writeJSONError(w, "Error reading request body", http.StatusBadRequest)
			return
		}
		log.Println("Raw request body:", string(body))

		r.Body = io.NopCloser(bytes.NewBuffer(body))

		var apiReq AnalyzeAPIRequest
		if err := json.NewDecoder(r.Body).Decode(&apiReq); err != nil {
			log.Printf("JSON Decode Error: %v\n", err)
			writeJSONError(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if len(apiReq.SliceToAnalyse) != 2 {
			writeJSONError(w, "sliceToAnalyse must contain exactly a start and end date", http.StatusBadRequest)
			return
		}

		if determineGranularity(apiReq.Interval) == "" {
			writeJSONError(w, fmt.Sprintf("unsupported interval: %s", apiReq.Interval), http.StatusBadRequest)
			return
		}

		if apiReq.MinimumSimilarityRate < 0 || apiReq.MinimumSimilarityRate > 100 {
			writeJSONError(w, "minimumSimilarityRate must be between 0 and 100", http.StatusBadRequest)
			return
		}
		minSimilarityRate := apiReq.MinimumSimilarityRate / 100

		assets, err := readAndUnmarshalAssets("./shares/sd.json")
		if err != nil {
			writeJSONError(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		startDateFromJSON, err := validateAndFetchData(apiReq.StockName, assets)
		if err != nil {
			writeJSONError(w, err.Error(), http.StatusBadRequest)
			return
		}

		if apiReq.StartDate.ToTime().Before(startDateFromJSON) {
			writeJSONError(w, "Requested start date is before the available date range for the stock", http.StatusBadRequest)
			return
		}

		shares, err := FetchFinanceData(apiReq.StockName, apiReq.Interval)
		if err != nil {
			log.Printf("Error fetching data for %s: %v\n", apiReq.StockName, err)
			if strings.Contains(err.Error(), "no data found") {
				writeJSONError(w, "Data not found for provided stock name or date range", http.StatusNotFound)
				return
			}
			writeJSONError(w, "Server error while fetching data", http.StatusInternalServerError)
			return
		}

		fmt.Println("found data for shares")

		searchShares := shares
		if apiReq.SearchScope == "" || apiReq.SearchScope == "viewRange" {
			searchShares = filterSharesByDateRange(shares, apiReq.StartDate.ToTime(), apiReq.EndDate.ToTime())
			log.Printf("Filtered shares to viewRange: %d out of %d candles\n", len(searchShares), len(shares))
		}

		targetPattern := prepareTargetPattern(apiReq, searchShares)

		matches, err := FindSimilarPricePatterns(targetPattern, searchShares, minSimilarityRate)
		if err != nil {
			log.Printf("Error finding similar price patterns: %v\n", err)
			writeJSONError(w, "Server error during analysis", http.StatusInternalServerError)
			return
		}

		lookAhead := apiReq.LookAheadCandles
		targetLen := len(targetPattern)
		if lookAhead <= 0 {
			lookAhead = targetLen
		}
		maxCap := 3 * targetLen
		if lookAhead > maxCap {
			lookAhead = maxCap
		}

		maxRes := apiReq.MaxResults
		if maxRes <= 0 {
			maxRes = 20
		}
		if maxRes > 100 {
			maxRes = 100
		}

		matches, stats := EnrichMatchesWithForwardData(matches, searchShares, lookAhead, maxRes)

		log.Println("Number of shares searched:", len(searchShares))
		log.Println("Number of matches:", len(matches))

		// Fire-and-forget: don't fail the request if the counter update fails,
		// and never write to w after the response body below has been sent.
		if err := incrementAPICounter(env, email); err != nil {
			log.Printf("Error incrementing API counter for %s: %v\n", email, err)
		}

		resp := APIResponse{Matches: matches, Stats: stats}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("Error encoding response: %v\n", err)
		}
	}
}

func HandleGetStockList(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		assetsData, err := os.ReadFile("./shares/sd.json")
		if err != nil {
			log.Printf("Error reading assets data: %v\n", err)
			writeJSONError(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		var assets []Asset
		err = json.Unmarshal(assetsData, &assets)
		if err != nil {
			log.Printf("Error unmarshaling assets data: %v\n", err)
			writeJSONError(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		resp := GetStockListAPIResponse{Assets: assets}

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(resp)
		if err != nil {
			log.Printf("Error encoding response: %v\n", err)
			writeJSONError(w, "Server error while preparing response", http.StatusInternalServerError)
			return
		}
	}
}

func HandleGetStockData(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		defer r.Body.Close()

		body, err := io.ReadAll(r.Body)
		if err != nil {
			writeJSONError(w, "Error reading request body", http.StatusInternalServerError)
			return
		}
		log.Println("Raw request body:", string(body))

		r.Body = io.NopCloser(bytes.NewBuffer(body))

		var apiReq StockDataAPIRequest
		if err := json.NewDecoder(r.Body).Decode(&apiReq); err != nil {
			log.Printf("JSON Decode Error: %v\n", err)
			writeJSONError(w, "Invalid Body", http.StatusBadRequest)
			return
		}

		assetsData, err := os.ReadFile("./shares/sd.json")
		if err != nil {
			log.Printf("Error reading assets data: %v\n", err)
			writeJSONError(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		var assets []Asset
		err = json.Unmarshal(assetsData, &assets)
		if err != nil {
			log.Printf("Error unmarshaling assets data: %v\n", err)
			writeJSONError(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		startDateFromJSON, err := validateAndFetchData(apiReq.StockName, assets)
		if err != nil {
			writeJSONError(w, err.Error(), http.StatusBadRequest)
			return
		}

		if apiReq.StartDate.ToTime().Before(startDateFromJSON) {
			writeJSONError(w, "Requested start date is before the available date range for the stock", http.StatusBadRequest)
			return
		}

		shares, err := FetchFinanceDataByDate(apiReq.StockName, apiReq.Interval, apiReq.StartDate, apiReq.EndDate)
		if err != nil {
			log.Printf("Error fetching data for %s: %v\n", apiReq.StockName, err)
			writeJSONError(w, err.Error(), http.StatusInternalServerError)
			return
		}

		resp := GetStockAPIResponse{Share: shares}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("Error encoding response: %v\n", err)
			writeJSONError(w, "Server error while preparing response", http.StatusInternalServerError)
			return
		}
	}
}

func HandleUpdateAllStocks(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		err := UpdateAllStocks()
		if err != nil {
			writeJSONError(w, "Failed to update all stocks: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("All stocks updated successfully"))
	}
}

func HandleUpdateStock(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		if r.Method == http.MethodOptions {
			return
		}

		defer r.Body.Close()

		body, err := io.ReadAll(r.Body)
		if err != nil {
			writeJSONError(w, "Error reading request body", http.StatusBadRequest)
			return
		}
		log.Println("Raw request body:", string(body))

		r.Body = io.NopCloser(bytes.NewBuffer(body))

		var apiReq AnalyzeAPIRequest
		if err := json.NewDecoder(r.Body).Decode(&apiReq); err != nil {
			log.Printf("JSON Decode Error: %v\n", err)
			writeJSONError(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		assets, err := readAndUnmarshalAssets("./shares/sd.json")
		if err != nil {
			writeJSONError(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		startDateFromJSON, err := validateAndFetchData(apiReq.StockName, assets)
		if err != nil {
			writeJSONError(w, err.Error(), http.StatusBadRequest)
			return
		}
		println("start date", startDateFromJSON.String())

		_, err = FetchFinanceData(apiReq.StockName, apiReq.Interval)
		if err != nil {
			log.Printf("Error fetching data for %s: %v\n", apiReq.StockName, err)
			if strings.Contains(err.Error(), "no data found") {
				writeJSONError(w, "Data not found for provided stock name or date range", http.StatusNotFound)
				return
			}
			writeJSONError(w, "Server error while fetching data", http.StatusInternalServerError)
			return
		}
	}
}

// Utility functions

func incrementAPICounter(env *handler.Env, email string) error {
	return env.DB.IncrementAPICounter(email)
}

func readAndUnmarshalAssets(filePath string) ([]Asset, error) {
	assetsData, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("Error reading assets data: %v\n", err)
		return nil, err
	}

	var assets []Asset
	if err = json.Unmarshal(assetsData, &assets); err != nil {
		log.Printf("Error unmarshaling assets data: %v\n", err)
		return nil, err
	}

	return assets, nil
}

func HandleGenerateSD(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		GenerateSD()

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("GenerateSD executed successfully"))
	}
}

func validateAndFetchData(StockName string, assets []Asset) (time.Time, error) {
	startDate, err := getStartDateFromJSON(StockName, assets)
	if err != nil {
		return time.Time{}, err
	}

	return startDate, nil
}

// filterSharesByDateRange returns a sub-slice of shares whose Date falls within
// [start, end] (inclusive). Assumes shares is sorted ascending by Date.
func filterSharesByDateRange(shares []Share, start, end time.Time) []Share {
	lo, hi := 0, len(shares)
	for lo < len(shares) && shares[lo].Date.Before(start) {
		lo++
	}
	for hi > 0 && shares[hi-1].Date.After(end) {
		hi--
	}
	if lo >= hi {
		return nil
	}
	out := make([]Share, hi-lo)
	copy(out, shares[lo:hi])
	return out
}

func prepareTargetPattern(apiReq AnalyzeAPIRequest, shares []Share) []Share {
	var targetPattern []Share
	startDate := apiReq.SliceToAnalyse[0].ToTime()
	endDate := apiReq.SliceToAnalyse[1].ToTime()

	for i := len(shares) - 1; i >= 0; i-- {
		share := shares[i]
		if !share.Date.Before(startDate) && share.Date.Before(endDate) {
			targetPattern = append(targetPattern, share)
		}
	}

	for i, j := 0, len(targetPattern)-1; i < j; i, j = i+1, j-1 {
		targetPattern[i], targetPattern[j] = targetPattern[j], targetPattern[i]
	}

	return targetPattern
}

func UpdateAllStocks() error {
	assets, err := readAndUnmarshalAssets("./shares/sd.json")
	if err != nil {
		return err
	}

	intervals := []string{"1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"}
	for _, asset := range assets {
		for _, intervalStr := range intervals {
			if err := UpdateStock(asset.Code, intervalStr); err != nil {
				log.Printf("Error updating stock %s for interval %s: %v\n", asset.Name, intervalStr, err)
				continue // Skip unsupported stocks
			}
		}
	}

	return nil
}

func UpdateStock(stockName string, interval string) error {
	assets, err := readAndUnmarshalAssets("./shares/sd.json")
	if err != nil {
		log.Printf("Error loading assets: %v", err)
		return err
	}

	_, err = validateAndFetchData(stockName, assets)
	if err != nil {
		log.Printf("Error validating and fetching data for stock %s: %v", stockName, err)
		return err
	}

	_, err = FetchFinanceData(stockName, interval)
	if err != nil {
		log.Printf("Error fetching finance data for %s from %s: %v", stockName, interval, err)
		return err
	}

	return nil
}

func getStartDateFromJSON(stockName string, assets []Asset) (time.Time, error) {
	for _, asset := range assets {
		if asset.Code == stockName { // assuming Code field is used to identify the stock
			return time.Parse("2006-01-02 15:04", asset.StartDate)
		}
	}
	return time.Time{}, fmt.Errorf("stock name not found in assets data")
}
