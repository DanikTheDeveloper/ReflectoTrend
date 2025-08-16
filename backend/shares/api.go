package shares

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
    "errors"
    "reflecto.trend/handler"
)

func HandleAnalyse(w http.ResponseWriter, r *http.Request) {
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
}

// readAndUnmarshalAssets reads and unmarshals the assets data from the specified file path.
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

    // If we are iterating in reverse, we do not need to prepend, we can append because
    // the slice is being filled from the end to the beginning.
    for i := len(shares) - 1; i >= 0; i-- {
        share := shares[i]
        // Use .After or equal to start, and .Before end
        if !share.Date.Before(startDate) && share.Date.Before(endDate) {
            targetPattern = append(targetPattern, share)
        }
    }

    // Since we appended in reverse order, we need to reverse targetPattern to maintain chronological order.
    for i, j := 0, len(targetPattern)-1; i < j; i, j = i+1, j-1 {
        targetPattern[i], targetPattern[j] = targetPattern[j], targetPattern[i]
    }

    return targetPattern
}

func HandleGetStockList(w http.ResponseWriter, r *http.Request) {
	assetsData, err := os.ReadFile("./shares/sd.json")
	if err != nil {
		log.Printf("Error reading assets data: %v\n", err)
		http.Error(w, "Server error while processing assets data", 500)
		return
	}

	var assets []Asset
	err = json.Unmarshal(assetsData, &assets)
	if err != nil {
		log.Printf("Error unmarshaling assets data: %v\n", err)
		http.Error(w, "Server error while processing assets data", 500)
		return
	}

	resp := GetStockListAPIResponse{Assets: assets}

	err = json.NewEncoder(w).Encode(resp)
	if err != nil {
		log.Printf("Error encoding response: %v\n", err)
		http.Error(w, "Server error while preparing response", 500) // StatusInternalServerError
		return
	}
}


func HandleGetStockData(env *handler.Env, w http.ResponseWriter, r *http.Request) error {
    // api to get the stock data for a particular stock
    // and interval

    defer r.Body.Close()

    body, err := io.ReadAll(r.Body)
    if err != nil {
        return handler.StatusError{Code: 500, Err: errors.New("Error Reading Request Body")}
    }
    log.Println("Raw request body:", string(body))

    r.Body = io.NopCloser(bytes.NewBuffer(body))

    var apiReq StockDataAPIRequest
    if err := json.NewDecoder(r.Body).Decode(&apiReq); err != nil {
        log.Printf("JSON Decode Error: %v\n", err)
        return handler.StatusError{Code: 400, Err: errors.New("Invalid Body")}
    }

	assetsData, err := os.ReadFile("./shares/sd.json")
	if err != nil {
		log.Printf("Error reading assets data: %v\n", err)
        return handler.StatusError{Code: 500, Err: errors.New("Server error while processing assets data")}
	}

	var assets []Asset
	err = json.Unmarshal(assetsData, &assets)
	if err != nil {
		log.Printf("Error unmarshaling assets data: %v\n", err)
        return handler.StatusError{Code: 500, Err: errors.New("Server error while processing assets data")}
	}

    startDateFromJSON, err := validateAndFetchData(apiReq.StockName, assets)
    if err != nil {
        return handler.StatusError{Code: 400, Err: err}
    }

    if apiReq.StartDate.ToTime().Before(startDateFromJSON) {
        return handler.StatusError{Code: 400, Err: errors.New("Requested start date is before the available date range for the stock")}
    }

    shares, err := FetchFinanceData(apiReq.StockName, apiReq.Interval)
    if err != nil {
        return handler.StatusError{Code: 500, Err: err}
    }

    resp := GetStockAPIResponse{Share: shares}
    if err := json.NewEncoder(w).Encode(resp); err != nil {
        log.Printf("Error encoding response: %v\n", err)
        return handler.StatusError{Code: 500, Err: errors.New("Server error while preparing response")}
    }
    return nil
}

// HandleUpdateAllStocks is an HTTP handler that triggers the update process for all stocks.
func HandleUpdateAllStocks(w http.ResponseWriter, r *http.Request) {
    // Assuming UpdateAllStocks does not need any request-specific parameters
    err := UpdateAllStocks() // This calls your previously defined UpdateAllStocks function
    if err != nil {
        http.Error(w, "Failed to update all stocks: "+err.Error(), http.StatusInternalServerError)
        return
    }

    // If everything goes well, send a success response
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("All stocks updated successfully"))
}

func UpdateAllStocks() error {
    assets, err := readAndUnmarshalAssets("./shares/sd.json")
    if err != nil {
        return err
    }

    intervals := []string{"1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"}
    for _, asset := range assets {
        for _, intervalStr := range intervals {
            if err != nil {
                log.Printf("Skipping interval %s for stock %s due to error: %v\n", intervalStr, asset.Name, err)
                continue // Skip unsupported intervals
            }
            if err := UpdateStock(asset.Name, intervalStr); err != nil {
                log.Printf("Error updating stock %s for interval %s: %v\n", asset.Name, intervalStr, err)
                continue // Skip unsupported stocks
            }
        }
    }

    return nil
}

func UpdateStock(stockName string, interval string) error {
    // First, load assets from the sd.json file, similar to HandleUpdateStock
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
        log.Printf("Error fetching finance data for %s from %s: %v", stockName, err)
        return err
    }

    return nil
}

func HandleUpdateStock(w http.ResponseWriter, r *http.Request) {
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

    // if apiReq.StartDate.ToTime().Before(startDateFromJSON) {
    //     http.Error(w, "Requested start date is before the available date range for the stock", http.StatusBadRequest)
    //     return
    // }

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

func getStartDateFromJSON(stockName string, assets []Asset) (time.Time, error) {
	for _, asset := range assets {
		if asset.Code == stockName { // assuming Code field is used to identify the stock
			return time.Parse(ctLayout, asset.StartDate)
		}
	}
	return time.Time{}, fmt.Errorf("stock name not found in assets data")
}
