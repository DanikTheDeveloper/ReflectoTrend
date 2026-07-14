package shares

import (
	"fmt"
	"os"
	"strings"
	"time"
	"github.com/markcheno/go-quote"
)

// SimilarSlice represents a matched pattern window with its forward data.
type SimilarSlice struct {
	Similarity    float64   `json:"similarity"`
	StartDate     time.Time `json:"startDate"`
	EndDate       time.Time `json:"endDate"`
	Slice         []Share   `json:"slice"`
	Forward       []Share   `json:"forward,omitempty"`
	ForwardReturn float64   `json:"forwardReturn,omitempty"`
	Truncated     bool      `json:"truncated,omitempty"`
	startIdx      int       // internal: index into historicalPatterns
}

// AnalyseStats holds aggregate statistics computed over all matched forward
// slices.
type AnalyseStats struct {
	SampleCount      int       `json:"sampleCount"`
	LookAheadCandles int       `json:"lookAheadCandles"`
	PctHigher        float64   `json:"pctHigher"`
	MedianReturn     float64   `json:"medianReturn"`
	MeanReturn       float64   `json:"meanReturn"`
	BestReturn       float64   `json:"bestReturn"`
	WorstReturn      float64   `json:"worstReturn"`
	MedianPath       []float64 `json:"medianPath"`
}

// APIResponse is the analyse endpoint response.
type APIResponse struct {
	Matches []SimilarSlice `json:"matches"`
	Stats   *AnalyseStats  `json:"stats"`
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
	SearchScope           string       `json:"searchScope"`
	LookAheadCandles      int          `json:"lookAheadCandles"`
	MaxResults            int          `json:"maxResults"`
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
	ctLayout = "2006-01-02 15:04:05"
)

// TIINGO_TOKEN is read from the environment; set it in .env. Never hardcode
// API tokens in source - they end up in git history.
var TIINGO_TOKEN = os.Getenv("TIINGO_TOKEN")

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
	s := strings.Trim(string(b), "\"")

	t, err := time.Parse("2006-01-02 15:04:05", s)
	if err != nil {
		t, err = time.Parse("2006-01-02 15:04", s)
		if err != nil {
			return err
		}
	}
	*ct = CustomTime(t)
	return nil
}
