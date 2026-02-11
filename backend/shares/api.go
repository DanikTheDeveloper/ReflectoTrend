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

	"github.com/julienschmidt/httprouter"
)

func HandleAnalyse(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		if r.Method == http.MethodOptions {
			return
		}

		email := r.Context().Value("email").(string)

		defer r.Body.Close()

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Error reading request body", http.StatusBadRequest)
			return
		}
		log.Println("Raw request body:", string(body))

		r.Body = io.NopCloser(bytes.NewBuffer(body))

		var apiReq AnalyzeAPIRequest
		if err := json.NewDecoder(r.Body).Decode(&apiReq); err != nil {
			log.Printf("JSON Decode Error: %v\n", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		assets, err := readAndUnmarshalAssets("./shares/sd.json")
		if err != nil {
			http.Error(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		startDateFromJSON, err := validateAndFetchData(apiReq.StockName, assets)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if apiReq.StartDate.ToTime().Before(startDateFromJSON) {
			http.Error(w, "Requested start date is before the available date range for the stock", http.StatusBadRequest)
			return
		}

		shares, err := FetchFinanceData(apiReq.StockName, apiReq.Interval)
		if err != nil {
			log.Printf("Error fetching data for %s: %v\n", apiReq.StockName, err)
			if strings.Contains(err.Error(), "no data found") {
				http.Error(w, "Data not found for provided stock name or date range", http.StatusNotFound)
				return
			}
			http.Error(w, "Server error while fetching data", http.StatusInternalServerError)
			return
		}

		targetPattern := prepareTargetPattern(apiReq, shares)

		similarSlices, err := FindSimilarPricePatterns(targetPattern, shares, apiReq.MinimumSimilarityRate)
		if err != nil {
			log.Printf("Error finding similar price patterns: %v\n", err)
			http.Error(w, "Server error during analysis", http.StatusInternalServerError)
			return
		}

		log.Println("Number of shares fetched:", len(shares))
		log.Println("Number of similar slices:", len(similarSlices))

		resp := APIResponse{SimilarSlices: similarSlices}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("Error encoding response: %v\n", err)
			http.Error(w, "Server error while preparing response", http.StatusInternalServerError)
			return
		}

		// Increment API counter for the user
		if err := incrementAPICounter(env, email); err != nil {
			log.Printf("Error incrementing API counter: %v\n", err)
			http.Error(w, "Server error while updating API counter", http.StatusInternalServerError)
			return
		}
	}
}

func HandleGetStockList(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		assetsData, err := os.ReadFile("./shares/sd.json")
		if err != nil {
			log.Printf("Error reading assets data: %v\n", err)
			http.Error(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		var assets []Asset
		err = json.Unmarshal(assetsData, &assets)
		if err != nil {
			log.Printf("Error unmarshaling assets data: %v\n", err)
			http.Error(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		resp := GetStockListAPIResponse{Assets: assets}

		err = json.NewEncoder(w).Encode(resp)
		if err != nil {
			log.Printf("Error encoding response: %v\n", err)
			http.Error(w, "Server error while preparing response", http.StatusInternalServerError)
			return
		}
	}
}

func HandleGetStockData(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		defer r.Body.Close()

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Error reading request body", http.StatusInternalServerError)
			return
		}
		log.Println("Raw request body:", string(body))

		r.Body = io.NopCloser(bytes.NewBuffer(body))

		var apiReq StockDataAPIRequest
		if err := json.NewDecoder(r.Body).Decode(&apiReq); err != nil {
			log.Printf("JSON Decode Error: %v\n", err)
			http.Error(w, "Invalid Body", http.StatusBadRequest)
			return
		}

		assetsData, err := os.ReadFile("./shares/sd.json")
		if err != nil {
			log.Printf("Error reading assets data: %v\n", err)
			http.Error(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		var assets []Asset
		err = json.Unmarshal(assetsData, &assets)
		if err != nil {
			log.Printf("Error unmarshaling assets data: %v\n", err)
			http.Error(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		startDateFromJSON, err := validateAndFetchData(apiReq.StockName, assets)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if apiReq.StartDate.ToTime().Before(startDateFromJSON) {
			http.Error(w, "Requested start date is before the available date range for the stock", http.StatusBadRequest)
			return
		}

		shares, err := FetchFinanceDataByDate(apiReq.StockName, apiReq.Interval, apiReq.StartDate, apiReq.EndDate)
		if err != nil {
			log.Printf("Error fetching data for %s: %v\n", apiReq.StockName, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		resp := GetStockAPIResponse{Share: shares}
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("Error encoding response: %v\n", err)
			http.Error(w, "Server error while preparing response", http.StatusInternalServerError)
			return
		}
	}
}

func HandleUpdateAllStocks(env *handler.Env) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		err := UpdateAllStocks()
		if err != nil {
			http.Error(w, "Failed to update all stocks: "+err.Error(), http.StatusInternalServerError)
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
			http.Error(w, "Error reading request body", http.StatusBadRequest)
			return
		}
		log.Println("Raw request body:", string(body))

		r.Body = io.NopCloser(bytes.NewBuffer(body))

		var apiReq AnalyzeAPIRequest
		if err := json.NewDecoder(r.Body).Decode(&apiReq); err != nil {
			log.Printf("JSON Decode Error: %v\n", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		assets, err := readAndUnmarshalAssets("./shares/sd.json")
		if err != nil {
			http.Error(w, "Server error while processing assets data", http.StatusInternalServerError)
			return
		}

		startDateFromJSON, err := validateAndFetchData(apiReq.StockName, assets)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		println("start date", startDateFromJSON.String())

		_, err = FetchFinanceData(apiReq.StockName, apiReq.Interval)
		if err != nil {
			log.Printf("Error fetching data for %s: %v\n", apiReq.StockName, err)
			if strings.Contains(err.Error(), "no data found") {
				http.Error(w, "Data not found for provided stock name or date range", http.StatusNotFound)
				return
			}
			http.Error(w, "Server error while fetching data", http.StatusInternalServerError)
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
			return time.Parse(ctLayout, asset.StartDate)
		}
	}
	return time.Time{}, fmt.Errorf("stock name not found in assets data")
}
