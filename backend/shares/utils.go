package shares

import (
	"math"
	"sort"
)

// This function remains unchanged
func FindSimilarPricePatterns(targetPattern []Share, historicalPatterns []Share, minSimilarityRate float64) ([]SimilarSlice, error) {
	var similarSlices []SimilarSlice

	for i := len(historicalPatterns) - len(targetPattern); i > 0; i-- {
		var pattern = historicalPatterns[i : i+len(targetPattern)]
		similarity := CalculateSimilarity(targetPattern, pattern)
		if similarity >= minSimilarityRate {
			similarSlices = append(similarSlices, SimilarSlice{Slice: pattern, SimilarityRate: similarity})
		}
	}

	sort.Slice(similarSlices, func(i, j int) bool {
		return similarSlices[i].SimilarityRate > similarSlices[j].SimilarityRate
	})

	return similarSlices, nil
}

// This function remains unchanged
func CalculateSimilarity(slice1, slice2 []Share) float64 {
	if len(slice1) != len(slice2) {
		return 0
	}

	var closePrices1, closePrices2 []float64
	for i := range slice1 {
		closePrices1 = append(closePrices1, slice1[i].Data.Close)
		closePrices2 = append(closePrices2, slice2[i].Data.Close)
	}

	return CalculatePearsonCorrelation(closePrices1, closePrices2)
}

// This function remains unchanged
func CalculatePearsonCorrelation(x, y []float64) float64 {
	n := len(x)
	sumX := 0.0
	sumY := 0.0
	sumX2 := 0.0
	sumY2 := 0.0
	sumXY := 0.0

	for i := 0; i < n; i++ {
		sumX += x[i]
		sumY += y[i]
		sumX2 += x[i] * x[i]
		sumY2 += y[i] * y[i]
		sumXY += x[i] * y[i]
	}

	numerator := float64(n)*sumXY - sumX*sumY
	denominator := math.Sqrt((float64(n)*sumX2 - sumX*sumX) * (float64(n)*sumY2 - sumY*sumY))

	if denominator == 0 {
		return 0
	}

	return numerator / denominator
}
