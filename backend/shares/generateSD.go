package shares

import (
	"encoding/json"
	"fmt"
	"time"
	"os"
)

func GenerateSD() {
	// Read the file content

	fileContent, err := os.ReadFile("shares/sd.json")
	if err != nil {
		fmt.Printf("Failed to read 'sd.json': %v\n", err)
		return
	}

	// Unmarshal the JSON content into the assets slice
	var assets []Asset
	err = json.Unmarshal(fileContent, &assets)
	if err != nil {
		fmt.Printf("Failed to unmarshal JSON content from 'sd.json': %v\n", err)
		return
	}

	// Loop through assets to find and set start dates
	for i, asset := range assets {
		startDate, err := FindStartDateForSymbol(asset.Code) 
		if err != nil {
			fmt.Printf("Failed to find start date for symbol %s: %v\n", asset.Code, err)
			continue
		}
		assets[i].StartDate = startDate.Format(ctLayout)
	}

	// Marshal the updated assets into JSON with indentation
	updatedContent, err := json.MarshalIndent(assets, "", "  ")
	if err != nil {
		fmt.Printf("Failed to marshal updated assets into JSON: %v\n", err)
		return
	}

    // Write the updated JSON content to a file
    err = os.WriteFile("shares/sd.json", updatedContent, os.ModePerm)
    if err != nil {
        fmt.Printf("Failed to write updated content to 'sd.json': %v\n", err)
        return
    }

	fmt.Println("Updated JSON successfully!")
}

func FindStartDateForSymbol(symbol string) (time.Time, error) {
    for year := 2010; year <= time.Now().Year(); year++ {
        start := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
        end := time.Date(year, 12, 31, 0, 0, 0, 0, time.UTC)

		shares, err := ProbeData(symbol, start, end, "d")
		if err == nil && len(shares) > 0 {
			return shares[0].Date, nil 
		}
    }

    return time.Time{}, fmt.Errorf("No start date found for %s", symbol)
}
