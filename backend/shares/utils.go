package shares

import (
	"math"
	"sort"
)

// overlapTolerance is the maximum fraction of the window length that two kept
// matches are allowed to overlap by before one of them is suppressed.
const overlapTolerance = 0.2

// FindSimilarPricePatterns scans historicalPatterns for windows whose shape is
// similar (Pearson correlation of percent returns) to targetPattern.
//
// Any window overlapping the target slice's own index range is skipped
// entirely (so the target never matches itself), and matches are then
// de-duplicated via non-max suppression: once sorted by similarity, a
// candidate window is kept only if it does not overlap an already-kept
// window by more than overlapTolerance of the window length.
func FindSimilarPricePatterns(targetPattern []Share, historicalPatterns []Share, minSimilarityRate float64) ([]SimilarSlice, error) {
	targetLen := len(targetPattern)
	if targetLen == 0 || len(historicalPatterns) < targetLen {
		return nil, nil
	}

	targetStartIdx := findPatternStartIndex(targetPattern, historicalPatterns)

	type candidate struct {
		startIdx   int
		similarity float64
	}

	var candidates []candidate
	for i := len(historicalPatterns) - targetLen; i >= 0; i-- {
		if targetStartIdx >= 0 && rangesOverlap(i, i+targetLen-1, targetStartIdx, targetStartIdx+targetLen-1) {
			continue
		}

		pattern := historicalPatterns[i : i+targetLen]
		similarity := CalculateSimilarity(targetPattern, pattern)
		if similarity >= minSimilarityRate {
			candidates = append(candidates, candidate{startIdx: i, similarity: similarity})
		}
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].similarity > candidates[j].similarity
	})

	maxOverlap := int(float64(targetLen) * overlapTolerance)

	var kept []candidate
	for _, c := range candidates {
		overlapsKept := false
		for _, k := range kept {
			if overlapAmount(c.startIdx, c.startIdx+targetLen-1, k.startIdx, k.startIdx+targetLen-1) > maxOverlap {
				overlapsKept = true
				break
			}
		}
		if !overlapsKept {
			kept = append(kept, c)
		}
	}

	similarSlices := make([]SimilarSlice, 0, len(kept))
	for _, k := range kept {
		pattern := historicalPatterns[k.startIdx : k.startIdx+targetLen]
		similarSlices = append(similarSlices, SimilarSlice{
			Similarity: k.similarity,
			StartDate:  pattern[0].Date,
			EndDate:    pattern[len(pattern)-1].Date,
			Slice:      pattern,
			startIdx:   k.startIdx,
		})
	}

	return similarSlices, nil
}

// findPatternStartIndex locates the index within historicalPatterns where
// targetPattern begins (by matching dates), or -1 if it can't be found (e.g.
// the target was built from a different data set).
func findPatternStartIndex(targetPattern, historicalPatterns []Share) int {
	targetLen := len(targetPattern)
	if targetLen == 0 {
		return -1
	}

	for i := 0; i+targetLen <= len(historicalPatterns); i++ {
		if !historicalPatterns[i].Date.Equal(targetPattern[0].Date) {
			continue
		}

		match := true
		for j := 1; j < targetLen; j++ {
			if !historicalPatterns[i+j].Date.Equal(targetPattern[j].Date) {
				match = false
				break
			}
		}
		if match {
			return i
		}
	}

	return -1
}

// rangesOverlap reports whether the inclusive index ranges [aStart, aEnd] and
// [bStart, bEnd] share any index.
func rangesOverlap(aStart, aEnd, bStart, bEnd int) bool {
	return aStart <= bEnd && bStart <= aEnd
}

// overlapAmount returns the number of indices shared between the inclusive
// ranges [aStart, aEnd] and [bStart, bEnd].
func overlapAmount(aStart, aEnd, bStart, bEnd int) int {
	start := aStart
	if bStart > start {
		start = bStart
	}
	end := aEnd
	if bEnd < end {
		end = bEnd
	}
	if end < start {
		return 0
	}
	return end - start + 1
}

// CalculateSimilarity compares two equal-length OHLC slices by computing the
// Pearson correlation of their Close-price percent returns. Percent returns
// are used instead of raw prices so the comparison is scale-invariant and
// measures shape rather than absolute trend/level.
func CalculateSimilarity(slice1, slice2 []Share) float64 {
	if len(slice1) != len(slice2) || len(slice1) < 2 {
		return 0
	}

	returns1 := closePercentReturns(slice1)
	returns2 := closePercentReturns(slice2)

	return CalculatePearsonCorrelation(returns1, returns2)
}

// closePercentReturns converts a slice's Close prices into percent returns:
// (c[i]-c[i-1])/c[i-1]. The result has one fewer element than shares.
func closePercentReturns(shares []Share) []float64 {
	if len(shares) < 2 {
		return nil
	}

	returns := make([]float64, 0, len(shares)-1)
	for i := 1; i < len(shares); i++ {
		prev := shares[i-1].Data.Close
		curr := shares[i].Data.Close
		if prev == 0 {
			returns = append(returns, 0)
			continue
		}
		returns = append(returns, (curr-prev)/prev)
	}

	return returns
}

// EnrichMatchesWithForwardData extracts forward OHLC slices for each match
// and computes aggregate outcome statistics.
func EnrichMatchesWithForwardData(matches []SimilarSlice, historicalPatterns []Share, lookAheadCandles, maxResults int) ([]SimilarSlice, *AnalyseStats) {
	if len(matches) == 0 || lookAheadCandles <= 0 {
		stats := &AnalyseStats{SampleCount: 0}
		return matches, stats
	}

	targetLen := 0
	if len(matches) > 0 {
		targetLen = len(matches[0].Slice)
	}

	// Limit the number of matches before enrichment.
	if maxResults <= 0 {
		maxResults = 20
	}
	if maxResults > 100 {
		maxResults = 100
	}
	if len(matches) > maxResults {
		matches = matches[:maxResults]
	}

	enriched := make([]SimilarSlice, 0, len(matches))
	for _, m := range matches {
		fwdStart := m.startIdx + targetLen
		fwdEnd := fwdStart + lookAheadCandles
		if fwdEnd > len(historicalPatterns) {
			fwdEnd = len(historicalPatterns)
		}

		var forward []Share
		truncated := false
		if fwdStart >= len(historicalPatterns) {
			forward = nil
			truncated = true
		} else {
			forward = historicalPatterns[fwdStart:fwdEnd]
			if len(forward) < lookAheadCandles {
				truncated = true
			}
		}

		forwardReturn := 0.0
		if len(forward) > 0 && len(m.Slice) > 0 {
			lastClose := m.Slice[len(m.Slice)-1].Data.Close
			fwdLastClose := forward[len(forward)-1].Data.Close
			if lastClose != 0 {
				forwardReturn = (fwdLastClose - lastClose) / lastClose
			}
		}

		m.Forward = forward
		m.ForwardReturn = forwardReturn
		m.Truncated = truncated
		enriched = append(enriched, m)
	}

	stats := computeAggregateStats(enriched, lookAheadCandles)
	return enriched, stats
}

func computeAggregateStats(matches []SimilarSlice, lookAheadCandles int) *AnalyseStats {
	stats := &AnalyseStats{
		SampleCount:      0,
		LookAheadCandles: lookAheadCandles,
	}

	stats.SampleCount = len(matches)
	if stats.SampleCount == 0 {
		return stats
	}

	returns := make([]float64, 0, len(matches))
	higher := 0
	for _, m := range matches {
		if len(m.Forward) == 0 {
			continue
		}
		r := m.ForwardReturn
		returns = append(returns, r)
		if r > 0 {
			higher++
		}
	}

	if len(returns) == 0 {
		return stats
	}

	stats.SampleCount = len(returns) // exclude matches with no forward data
	stats.PctHigher = float64(higher) / float64(len(returns))
	stats.MeanReturn = mean(returns)
	stats.BestReturn = maxFloat(returns)
	stats.WorstReturn = minFloat(returns)
	stats.MedianReturn = median(returns)

	// Per-step median path across all matches.
	if lookAheadCandles > 0 && len(matches) > 0 {
		path := make([]float64, lookAheadCandles)
		for step := 0; step < lookAheadCandles; step++ {
			var stepReturns []float64
			for _, m := range matches {
				if step < len(m.Forward) {
					lastClose := m.Slice[len(m.Slice)-1].Data.Close
					if lastClose != 0 {
						stepReturns = append(stepReturns, (m.Forward[step].Data.Close-lastClose)/lastClose)
					}
				}
			}
			if len(stepReturns) > 0 {
				path[step] = median(stepReturns)
			}
		}
		stats.MedianPath = path
	}

	return stats
}

func mean(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	s := 0.0
	for _, v := range vals {
		s += v
	}
	return s / float64(len(vals))
}

func median(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	sorted := make([]float64, len(vals))
	copy(sorted, vals)
	sort.Float64s(sorted)
	n := len(sorted)
	if n%2 == 0 {
		return (sorted[n/2-1] + sorted[n/2]) / 2
	}
	return sorted[n/2]
}

func maxFloat(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	m := vals[0]
	for _, v := range vals {
		if v > m {
			m = v
		}
	}
	return m
}

func minFloat(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	m := vals[0]
	for _, v := range vals {
		if v < m {
			m = v
		}
	}
	return m
}

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
