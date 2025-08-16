package shares

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"
	
    "net/http"

	_ "github.com/mattn/go-sqlite3" // SQLite driver
)

// FetchFinanceData fetches and saves financial data in a database
func FetchFinanceData(code string, interval string) ([]Share, error) {
	dbName := code + "_" + interval + ".db"
	db, err := sql.Open("sqlite3", dbName)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}
	defer db.Close()

	start, needInitialization, err := checkDatabaseInitialization(db, code)
	if err != nil {
		return nil, err
	}

	end := time.Now()
	var newShares, oldShares []Share

	if needInitialization {
		newShares, err = fetchDataAndInitializeDB(db, code, start, end, interval)
	} else {
		oldShares, err = loadSharesFromDatabase(db)
		if err != nil {
			return nil, err
		}
		newShares, err = fetchAndAppendNewData(db, code, start, end, interval, oldShares)
	}

	if err != nil {
		return nil, err
	}

	if len(newShares) == 0 && len(oldShares) > 0 {
		return oldShares, nil
	}

	return newShares, nil
}

func checkDatabaseInitialization(db *sql.DB, code string) (time.Time, bool, error) {
	// Check if table exists
	var tableName string
	err := db.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='shares'").Scan(&tableName)
	if err != nil && err != sql.ErrNoRows {
		return time.Time{}, false, fmt.Errorf("error checking if table exists: %v", err)
	}

	// If table does not exist, initialize database
	if tableName == "" {
		start, err := readStartDateFromJSON(code)
		if err != nil {
			return time.Time{}, false, err
		}
		return start, true, nil
	}

	return time.Now(), false, nil
}

func fetchDataAndInitializeDB(db *sql.DB, code string, start, end time.Time, interval string) ([]Share, error) {
	// Create table
	_, err := db.Exec("CREATE TABLE shares (id INTEGER PRIMARY KEY, date TEXT, open REAL, high REAL, low REAL, close REAL)")
	if err != nil {
		return nil, fmt.Errorf("error creating table: %v", err)
	}

	// Fetch and insert data
	return fetchAndInsertData(db, code, start, end, interval)
}

func fetchAndAppendNewData(db *sql.DB, code string, start, end time.Time, interval string, oldShares []Share) ([]Share, error) {
	// Fetch new data
	newShares, err := fetchAndInsertData(db, code, start, end, interval)
	if err != nil {
		return nil, err
	}

	// Append new data to old data
	return append(oldShares, newShares...), nil
}

func loadSharesFromDatabase(db *sql.DB) ([]Share, error) {
	rows, err := db.Query("SELECT date, open, high, low, close FROM shares")
	if err != nil {
		return nil, fmt.Errorf("error querying data: %v", err)
	}
	defer rows.Close()

	var shares []Share
	for rows.Next() {
		var share Share
		var dateStr string
		if err := rows.Scan(&dateStr, &share.Data.Open, &share.Data.High, &share.Data.Low, &share.Data.Close); err != nil {
			return nil, fmt.Errorf("error scanning row: %v", err)
		}
		share.Date, err = time.Parse(ctLayout, dateStr)
		if err != nil {
			return nil, fmt.Errorf("error parsing date: %v", err)
		}
		shares = append(shares, share)
	}
	return shares, nil
}

func fetchAndInsertData(db *sql.DB, code string, start, end time.Time, interval string) ([]Share, error) {
    shares, err := ProbeData(code, start, end, interval)
    if err != nil {
        return nil, err
    }

    stmt, err := db.Prepare("INSERT INTO shares (date, open, high, low, close) VALUES (?, ?, ?, ?, ?)")
    if err != nil {
        return nil, fmt.Errorf("error preparing insert statement: %v", err)
    }
    defer stmt.Close()

    for _, share := range shares {
        formattedDate := share.Date.Format(ctLayout) // Format the date according to ctLayout
        _, err := stmt.Exec(formattedDate, share.Data.Open, share.Data.High, share.Data.Low, share.Data.Close)
        if err != nil {
            return nil, fmt.Errorf("error inserting share: %v", err)
        }
    }
    return shares, nil
}

func readStartDateFromJSON(code string) (time.Time, error) {
	fileContent, err := os.ReadFile("shares/sd.json")
	if err != nil {
		return time.Time{}, err
	}

	var assets []Asset
	err = json.Unmarshal(fileContent, &assets)
	if err != nil {
		return time.Time{}, err
	}

	for _, asset := range assets {
		if asset.Code == code {
			startDate, err := time.Parse("2006-01-02 15:04", asset.StartDate)
			if err != nil {
				return time.Time{}, fmt.Errorf("invalid date format: %v", err)
			}
			return startDate, nil
		}
	}
	return time.Time{}, errors.New("code not found")
}

func ProbeData(code string, start, end time.Time, interval string) ([]Share, error) {
	var allShares []Share

	// Adjustable step size, initially set to 1 week
	stepSize := time.Hour * 24 * 7

	for currentStart := start; currentStart.Before(end); currentStart = currentStart.Add(stepSize) {
		currentEnd := currentStart.Add(stepSize)
		if currentEnd.After(end) {
			currentEnd = end
		}

		shares, err := fetchSharesForInterval(code, currentStart, currentEnd, interval)
		if err != nil {
			return nil, err
		}

		allShares = append(allShares, shares...)
	}

	return allShares, nil
}

func fetchSharesForInterval(code string, start, end time.Time, interval string) ([]Share, error) {
    var shares []Share
    granularity := determineGranularity(interval)

    // Ensure granularity is within expected values
    if granularity == "" {
        return nil, fmt.Errorf("invalid interval for granularity determination: %s", interval)
    }

    url := fmt.Sprintf("https://api.pro.coinbase.com/products/%s/candles?start=%s&end=%s&granularity=%s",
        code, start.Format(time.RFC3339), end.Format(time.RFC3339), granularity)

    resp, err := http.Get(url)
    if err != nil {
        return nil, fmt.Errorf("error fetching Coinbase data: %v", err)
    }
    defer resp.Body.Close()

    // Check for non-200 status code
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("received non-200 status code: %d", resp.StatusCode)
    }

    var candles [][]float64
    err = json.NewDecoder(resp.Body).Decode(&candles)
    if err != nil {
        return nil, fmt.Errorf("error unmarshaling response: %v", err)
    }

    for _, c := range candles {
        if len(c) < 5 { // Ensure there are enough elements in the slice to prevent index out of range errors
            return nil, fmt.Errorf("unexpected candle data format: %+v", c)
        }
        share := Share{
            Date: time.Unix(int64(c[0]), 0),
            Data: OHLC{
                Open:  c[3],
                High:  c[2],
                Low:   c[1],
                Close: c[4],
            },
        }
        shares = append(shares, share)
    }

    return shares, nil
}

func determineGranularity(interval string) string {
    switch interval {
    case "1m":
        return "60"
    case "5m":
        return "300"
    case "15m":
        return "900"
    case "1h":
        return "3600"
    case "6h":
        return "21600"
    case "1d":
        return "86400"
    default:
        return "" // Return an empty string to indicate an invalid or unsupported interval
    }
}

func LoadSharesFromDatabase(dbName string) ([]Share, error) {
	db, err := sql.Open("sqlite3", dbName)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}
	defer db.Close()

	rows, err := db.Query("SELECT * FROM shares")
	if err != nil {
		return nil, fmt.Errorf("error querying data: %v", err)
	}
	defer rows.Close()

	var shares []Share
	for rows.Next() {
		var share Share
		// Assuming Share struct has fields corresponding to the database columns
		if err := rows.Scan(/* fields */); err != nil {
			return nil, fmt.Errorf("error scanning row: %v", err)
		}
		shares = append(shares, share)
	}

	return shares, nil
}
