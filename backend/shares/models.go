package shares

import (
	"fmt"
	"strings"
	"time"
	"github.com/markcheno/go-quote"
)

// SimilarSlice represents a slice of stock data that is similar to a given pattern
type SimilarSlice struct {
    Slice          []Share  // Changed to hold a slice of Share
    SimilarityRate float64
}

// APIResponse and other API-related structs
type APIResponse struct {
	SimilarSlices []SimilarSlice `json:"similarSlices"`
}

type GetStockAPIResponse struct {
	Share []Share `json:"share"`
}

type GetStockListAPIResponse struct {
	Assets []Asset `json:"assets"`
}

// to display the stock data in the browser
type StockDataAPIRequest struct {
    StockName string `json:"stockName"`
    Interval  string `json:"interval"`
    StartDate CustomTime `json:"startDate"`
    EndDate CustomTime `json:"endDate"`
}

type StockDataAPIResponse struct {
    StockData []Share `json:"stockData"`
}

type AnalyzeAPIRequest struct {
	StockName             string       `json:"stockName"`
	StartDate             CustomTime   `json:"startDate"`
	EndDate               CustomTime   `json:"endDate"`
	SliceToAnalyse        []CustomTime `json:"sliceToAnalyse"`
	MinimumSimilarityRate float64      `json:"minimumSimilarityRate"`
	Interval              string       `json:"interval"`
}

type ShareAPIRequest struct {
	StockName string `json:"stockName"`
	Interval  string `json:"interval"`
}

// Period represents time intervals for stock data
type Period string

const (
	Daily   Period = "d"
	Weekly  Period = "w"
	Monthly Period = "m"
)

// convertInterval converts a string interval to a quote.Period
func convertInterval(interval string) (quote.Period, error) {
	switch interval {
	case "1m":
		return quote.Min1, nil
	case "3m":
		return quote.Min3, nil
	case "5m":
		return quote.Min5, nil
	case "15m":
		return quote.Min15, nil
	case "30m":
		return quote.Min30, nil
	case "1h":
		return quote.Min60, nil
	case "2h":
		return quote.Hour2, nil
	case "4h":
		return quote.Hour4, nil
	case "6h":
		return quote.Hour6, nil
	case "8h":
		return quote.Hour8, nil
	case "12h":
		return quote.Hour12, nil
	case "d", "1d":
		return quote.Daily, nil
	case "3d":
		return quote.Day3, nil
	case "w", "1w":
		return quote.Weekly, nil
	case "m", "1M":
		return quote.Monthly, nil
	default:
		return "", fmt.Errorf("unsupported interval: %s", interval)
	}
}

// Flags struct for additional options
type Flags struct {
	token  string
	adjust bool
}

const (
	TIINGO_TOKEN = "503caf22f92458ab311ff26a3de091d89e9cb73c"
	ctLayout     = "2006-01-02 04:05"
)

// CustomTime is a wrapper for time.Time to handle custom JSON unmarshalling
type CustomTime time.Time

// OHLC represents Open-High-Low-Close stock data
type OHLC struct {
	Open  float64
	High  float64
	Low   float64
	Close float64
}

// Share holds information about a stock's data for a particular date
type Share struct {
	Date time.Time
	Data OHLC
}

// Asset represents information about a financial asset
type Asset struct {
	Name      string `json:"name"`
	Code      string `json:"code"`
	StartDate string `json:"startDate,omitempty"`
	Type      string `json:"type"`
}

// CustomTime methods to handle JSON (un)marshalling
func (ct CustomTime) ToTime() time.Time {
	return time.Time(ct)
}

func (ct *CustomTime) UnmarshalJSON(b []byte) error {
	t, err := time.Parse(ctLayout, strings.Trim(string(b), "\""))
	if err != nil {
		return err
	}
	*ct = CustomTime(t)
	return nil
}
