package shares

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"io"
	"time"
    "net/http"
    "strconv"

	_ "github.com/mattn/go-sqlite3" 
)


func StockUpdateAll() error {
	assets, err := readAndUnmarshalAssets("./shares/sd.json")
	if err != nil {
		return err
	}

	intervals := []string{"1m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w"}
	for _, asset := range assets {
		for _, intervalStr := range intervals {
			if _, err := StockUpdate(asset.Code, intervalStr); err != nil {
				fmt.Printf("Error updating stock %s for interval %s: %v\n", asset.Name, intervalStr, err)
				continue
			}
		}
	}

	return nil
}

func StockUpdate(code string, interval string) ([]Share, error) {
	dbName := "./data/" + code + "_" + interval + ".db"
	db, err := sql.Open("sqlite3", dbName)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}
	defer db.Close()

	if _, err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		return nil, fmt.Errorf("error enabling WAL mode: %v", err)
	}

	end := time.Now()
	start, needInitialization, err := CheckDatabaseInitialization(db, code)
	if err != nil {
		return nil, err
	} else if !start.Before(end) {
		fmt.Println("Could not find start date")
        return nil, errors.New("Could not find start date")
    }

    fmt.Println("in fetch finance data", start)
	var newShares, oldShares []Share

	if needInitialization {
		err = FetchDataAndInitializeDB(db, code, start, end, interval)
	} else {
		oldShares, err = LoadSharesFromDb(db)
		if err != nil {
			return nil, err
		}
		err = FetchAndAppendNewData(db, code, start, end, interval, oldShares)
	}

	if err != nil {
		return nil, err
	}

	if len(newShares) == 0 && len(oldShares) > 0 {
		return oldShares, nil
	}

	return newShares, nil
}

func CheckDatabaseInitialization(db *sql.DB, code string) (time.Time, bool, error) {
	var tableName sql.NullString
    var dateStr sql.NullString
    var start time.Time
	err := db.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='shares'").Scan(&tableName)
	if err != nil && err != sql.ErrNoRows {
		return time.Time{}, false, fmt.Errorf("error checking if table exists: %v", err)
	}
    if tableName.String == "shares" {
        err = db.QueryRow("SELECT MAX(date) FROM shares;").Scan(&dateStr)
        if dateStr.Valid && err == nil {
            start, err = time.Parse(ctLayout, dateStr.String)
            if err == nil {
                return start, false, nil
            }
        }
    }

    start, err = ReadStartDateFromJSON(code)
    if err != nil {
        fmt.Println(err)
        return time.Time{}, false, err
    }
    if tableName.String == "" {
        return start, true, nil
    }  else {
        return start, false, nil
    }
}

func FetchDataAndInitializeDB(db *sql.DB, code string, start, end time.Time, interval string) (error) {
	// Create table
	_, err := db.Exec("CREATE TABLE shares (id INTEGER PRIMARY KEY, date TEXT UNIQUE, open REAL, high REAL, low REAL, close REAL)")
	if err != nil {
		return fmt.Errorf("error creating table: %v", err)
	}

	// Fetch and insert data
	return FetchAndInsertData(db, code, start, end, interval)
}

func FetchAndAppendNewData(db *sql.DB, code string, start, end time.Time, interval string, oldShares []Share) (error) {
	// Fetch new data
	err := FetchAndInsertData(db, code, start, end, interval)
	if err != nil {
		return err
	}
	return nil
}

func LoadSharesFromDb(db *sql.DB) ([]Share, error) {
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

func FetchAndInsertData(db *sql.DB, code string, start, end time.Time, interval string) error {
	if start.After(end) || start.Equal(end) {
		return fmt.Errorf("start time must be before end time")
	}

	stmt, err := db.Prepare("INSERT OR IGNORE INTO shares (date, open, high, low, close) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		return fmt.Errorf("error preparing insert statement: %v", err)
	}
	defer stmt.Close()

	if determineGranularity(interval) == "" {
		return fmt.Errorf("invalid interval: %s", interval)
	}

	intervalDur := intervalDuration(interval)
	totalDuration := end.Sub(start)
	totalDataPoints := int(totalDuration / intervalDur)
	
	maxDataPointsPerRequest := 1000
	numRequests := (totalDataPoints + maxDataPointsPerRequest - 1) / maxDataPointsPerRequest
	
	if numRequests == 0 {
		numRequests = 1
	}

	stepSize := totalDuration / time.Duration(numRequests)

	for currentStart := start; currentStart.Before(end); currentStart = currentStart.Add(stepSize) {
		currentEnd := currentStart.Add(stepSize)
		if currentEnd.After(end) {
			currentEnd = end
		}

		shares, err := FetchSharesForInterval(code, currentStart, currentEnd, interval)
		if err != nil {
			return err
		}
		
		for _, share := range shares {
			formattedDate := share.Date.Format(ctLayout)
			_, err := stmt.Exec(formattedDate, share.Data.Open, share.Data.High, share.Data.Low, share.Data.Close)
			if err != nil {
				return fmt.Errorf("error inserting share: %v", err)
			}
		}
		
		time.Sleep(100 * time.Millisecond)
	}
	return nil
}


func ReadStartDateFromJSON(code string) (time.Time, error) {
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


func FetchSharesForInterval(code string, start, end time.Time, interval string) ([]Share, error) {
	if determineGranularity(interval) == "" {
		return nil, fmt.Errorf("invalid interval: %s", interval)
	}

	symbol := toBinanceSymbol(code)
	startMs := start.UnixMilli()
	endMs := end.UnixMilli()

	url := fmt.Sprintf("https://api.binance.com/api/v3/klines?symbol=%s&interval=%s&startTime=%d&endTime=%d&limit=1000",
		symbol, interval, startMs, endMs)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0")

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error fetching Binance data: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("received status code %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var rawKlines [][]json.RawMessage
	err = json.NewDecoder(resp.Body).Decode(&rawKlines)
	if err != nil {
		return nil, fmt.Errorf("error unmarshaling response: %v", err)
	}

	var shares []Share
	for _, k := range rawKlines {
		if len(k) < 5 {
			return nil, fmt.Errorf("unexpected kline data format: %+v", k)
		}

		var timestampMs int64
		if err := json.Unmarshal(k[0], &timestampMs); err != nil {
			return nil, fmt.Errorf("error parsing timestamp: %v", err)
		}

		var openStr, highStr, lowStr, closeStr string
		if err := json.Unmarshal(k[1], &openStr); err != nil {
			return nil, fmt.Errorf("error parsing open: %v", err)
		}
		if err := json.Unmarshal(k[2], &highStr); err != nil {
			return nil, fmt.Errorf("error parsing high: %v", err)
		}
		if err := json.Unmarshal(k[3], &lowStr); err != nil {
			return nil, fmt.Errorf("error parsing low: %v", err)
		}
		if err := json.Unmarshal(k[4], &closeStr); err != nil {
			return nil, fmt.Errorf("error parsing close: %v", err)
		}

		open, _ := strconv.ParseFloat(openStr, 64)
		high, _ := strconv.ParseFloat(highStr, 64)
		low, _ := strconv.ParseFloat(lowStr, 64)
		close, _ := strconv.ParseFloat(closeStr, 64)

		shares = append(shares, Share{
			Date: time.UnixMilli(timestampMs),
			Data: OHLC{Open: open, High: high, Low: low, Close: close},
		})
	}

	if len(shares) == 0 {
		return []Share{}, nil
	}

	return shares, nil
}



