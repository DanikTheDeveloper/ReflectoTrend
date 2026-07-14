package shares

import (
	"math"
	"testing"
	"time"
)

func sharesFromCloses(t *testing.T, start time.Time, step time.Duration, closes []float64) []Share {
	t.Helper()
	shares := make([]Share, len(closes))
	for i, c := range closes {
		shares[i] = Share{
			Date: start.Add(time.Duration(i) * step),
			Data: OHLC{Open: c, High: c, Low: c, Close: c},
		}
	}
	return shares
}

func almostEqual(a, b, eps float64) bool {
	return math.Abs(a-b) <= eps
}

func TestClosePercentReturns(t *testing.T) {
	shares := sharesFromCloses(t, time.Now(), time.Hour, []float64{100, 110, 99})

	returns := closePercentReturns(shares)

	want := []float64{0.10, -0.10}
	if len(returns) != len(want) {
		t.Fatalf("got %d returns, want %d", len(returns), len(want))
	}
	for i := range want {
		if !almostEqual(returns[i], want[i], 1e-9) {
			t.Errorf("returns[%d] = %v, want %v", i, returns[i], want[i])
		}
	}
}

func TestClosePercentReturnsTooShort(t *testing.T) {
	if got := closePercentReturns(nil); got != nil {
		t.Errorf("expected nil for empty input, got %v", got)
	}
	if got := closePercentReturns(sharesFromCloses(t, time.Now(), time.Hour, []float64{100})); got != nil {
		t.Errorf("expected nil for single-element input, got %v", got)
	}
}

func TestCalculatePearsonCorrelationKnownSeries(t *testing.T) {
	cases := []struct {
		name string
		x, y []float64
		want float64
	}{
		{"perfectly correlated", []float64{1, 2, 3, 4}, []float64{2, 4, 6, 8}, 1},
		{"perfectly anti-correlated", []float64{1, 2, 3, 4}, []float64{4, 3, 2, 1}, -1},
		{"no variance denominator zero", []float64{1, 1, 1}, []float64{1, 2, 3}, 0},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := CalculatePearsonCorrelation(c.x, c.y)
			if !almostEqual(got, c.want, 1e-9) {
				t.Errorf("CalculatePearsonCorrelation(%v, %v) = %v, want %v", c.x, c.y, got, c.want)
			}
		})
	}
}

func TestCalculateSimilarityUsesReturnsNotRawPrices(t *testing.T) {
	base := time.Now()

	// Same shape (percent returns), but shifted in absolute level: raw-price
	// Pearson would still correlate here since it's a monotonic transform, so
	// use a case where the *shape* differs but the raw uptrend direction is
	// the same, to prove returns (not levels) drive the result.
	target := sharesFromCloses(t, base, time.Hour, []float64{100, 110, 121, 108.9})     // +10%, +10%, -10%
	sameShape := sharesFromCloses(t, base, time.Hour, []float64{50, 55, 60.5, 54.45})   // +10%, +10%, -10%
	differentShape := sharesFromCloses(t, base, time.Hour, []float64{100, 105, 120, 100}) // +5%, +14.3%, -16.7%

	simSameShape := CalculateSimilarity(target, sameShape)
	if !almostEqual(simSameShape, 1, 1e-6) {
		t.Errorf("expected near-perfect similarity for identical return shape, got %v", simSameShape)
	}

	simDifferentShape := CalculateSimilarity(target, differentShape)
	if simDifferentShape >= simSameShape {
		t.Errorf("expected different-shaped series to score lower than identical-shaped series: different=%v same=%v", simDifferentShape, simSameShape)
	}
}

func TestCalculateSimilarityLengthMismatch(t *testing.T) {
	a := sharesFromCloses(t, time.Now(), time.Hour, []float64{1, 2, 3})
	b := sharesFromCloses(t, time.Now(), time.Hour, []float64{1, 2})

	if got := CalculateSimilarity(a, b); got != 0 {
		t.Errorf("expected 0 for mismatched lengths, got %v", got)
	}
}

func TestFindSimilarPricePatternsExcludesTargetOwnWindow(t *testing.T) {
	base := time.Now()
	// 20 candles, ascending order (oldest first), matching real data ordering.
	closes := make([]float64, 20)
	for i := range closes {
		closes[i] = 100 + float64(i)
	}
	historical := sharesFromCloses(t, base, time.Hour, closes)

	targetStart, targetLen := 5, 4
	target := make([]Share, targetLen)
	copy(target, historical[targetStart:targetStart+targetLen])

	matches, err := FindSimilarPricePatterns(target, historical, 0.99)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for _, m := range matches {
		if m.StartDate.Equal(target[0].Date) && m.EndDate.Equal(target[targetLen-1].Date) {
			t.Errorf("match should never equal the target's own window: %+v", m)
		}
	}
}

func TestFindSimilarPricePatternsLoopIncludesIndexZero(t *testing.T) {
	base := time.Now()

	// Window [0,3] has a distinctive return shape (+2%, -1%, +3%) that is
	// deliberately mirrored (at a different price scale) in window [8,11],
	// which we use as the target. Every other window in between has an
	// unrelated shape, so index 0 is the *only* window that can match at a
	// 0.99 similarity threshold - if the sliding-window loop's bound skipped
	// index 0 (the original off-by-one bug), no match would be returned.
	closes := []float64{
		100, 102, 100.98, 104.0094, // idx 0-3: +2%, -1%, +3%
		90, 85, 92, 80, // idx 4-7: unrelated shape
		50, 51, 50.49, 52.0047, // idx 8-11: +2%, -1%, +3% (target)
	}
	historical := sharesFromCloses(t, base, time.Hour, closes)

	targetLen := 4
	target := make([]Share, targetLen)
	copy(target, historical[8:8+targetLen])

	matches, err := FindSimilarPricePatterns(target, historical, 0.99)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	foundIndexZero := false
	for _, m := range matches {
		if m.StartDate.Equal(historical[0].Date) {
			foundIndexZero = true
		}
	}
	if !foundIndexZero {
		t.Errorf("expected a match starting at index 0 (off-by-one loop bound), matches: %+v", matches)
	}
}

func TestFindSimilarPricePatternsNonMaxSuppression(t *testing.T) {
	base := time.Now()
	// Sawtooth-like series with a repeating shape every 2 candles so that a
	// sliding window search returns many overlapping near-identical matches.
	closes := make([]float64, 40)
	for i := range closes {
		closes[i] = 100 + 5*math.Sin(float64(i))
	}
	historical := sharesFromCloses(t, base, time.Hour, closes)

	targetLen := 6
	target := make([]Share, targetLen)
	copy(target, historical[0:targetLen])

	matches, err := FindSimilarPricePatterns(target, historical, 0.9)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	maxOverlap := int(float64(targetLen) * overlapTolerance)
	for i := 0; i < len(matches); i++ {
		for j := i + 1; j < len(matches); j++ {
			iStart := indexOfDate(historical, matches[i].StartDate)
			jStart := indexOfDate(historical, matches[j].StartDate)
			overlap := overlapAmount(iStart, iStart+targetLen-1, jStart, jStart+targetLen-1)
			if overlap > maxOverlap {
				t.Errorf("matches %d and %d overlap by %d (> tolerance %d): %+v vs %+v", i, j, overlap, maxOverlap, matches[i], matches[j])
			}
		}
	}
}

func indexOfDate(shares []Share, date time.Time) int {
	for i, s := range shares {
		if s.Date.Equal(date) {
			return i
		}
	}
	return -1
}

func TestFindSimilarPricePatternsEmptyTarget(t *testing.T) {
	historical := sharesFromCloses(t, time.Now(), time.Hour, []float64{1, 2, 3})
	matches, err := FindSimilarPricePatterns(nil, historical, 0.5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if matches != nil {
		t.Errorf("expected nil matches for empty target, got %+v", matches)
	}
}

func makeTestMatch(hist []Share, startIdx, targetLen int) SimilarSlice {
	sl := hist[startIdx : startIdx+targetLen]
	return SimilarSlice{
		Similarity: 0.9,
		StartDate:  sl[0].Date,
		EndDate:    sl[len(sl)-1].Date,
		Slice:      sl,
		startIdx:   startIdx,
	}
}

func TestEnrichForwardBasic(t *testing.T) {
	base := time.Now()
	hist := sharesFromCloses(t, base, time.Hour, []float64{
		100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
	})

	matches := []SimilarSlice{
		makeTestMatch(hist, 0, 2), // idx 0-1, forward = idx 2-4
		makeTestMatch(hist, 3, 2), // idx 3-4, forward = idx 5-7
	}

	enriched, stats := EnrichMatchesWithForwardData(matches, hist, 3, 10)

	if len(enriched) != 2 {
		t.Fatalf("expected 2 enriched matches, got %d", len(enriched))
	}

	if len(enriched[0].Forward) != 3 {
		t.Errorf("match 0: expected 3 forward candles, got %d", len(enriched[0].Forward))
	}
	if enriched[0].Truncated {
		t.Errorf("match 0: should not be truncated, got truncated=true")
	}

	fwd0 := enriched[0].Forward
	if len(fwd0) >= 3 {
		if !fwd0[0].Date.Equal(hist[2].Date) {
			t.Errorf("match 0 forward[0] date=%v, want hist[2]=%v", fwd0[0].Date, hist[2].Date)
		}
		if !fwd0[2].Date.Equal(hist[4].Date) {
			t.Errorf("match 0 forward[2] date=%v, want hist[4]=%v", fwd0[2].Date, hist[4].Date)
		}
	}

	expectedReturn := (hist[4].Data.Close - hist[1].Data.Close) / hist[1].Data.Close
	if !almostEqual(enriched[0].ForwardReturn, expectedReturn, 1e-9) {
		t.Errorf("match 0 forwardReturn=%v, want %v", enriched[0].ForwardReturn, expectedReturn)
	}

	if stats.SampleCount != 2 {
		t.Errorf("stats.SampleCount=%d, want 2", stats.SampleCount)
	}
	if stats.LookAheadCandles != 3 {
		t.Errorf("stats.LookAheadCandles=%d, want 3", stats.LookAheadCandles)
	}
}

func TestEnrichForwardBoundary(t *testing.T) {
	base := time.Now()
	// Only enough data for a partial forward slice (2 candles when 5 requested).
	hist := sharesFromCloses(t, base, time.Hour, []float64{100, 101, 102, 103, 104})
	matches := []SimilarSlice{
		makeTestMatch(hist, 0, 3), // idx 0-2, forward = idx 3-4 (2 candles, not 5)
	}

	enriched, stats := EnrichMatchesWithForwardData(matches, hist, 5, 10)

	if len(enriched[0].Forward) != 2 {
		t.Errorf("expected 2 forward candles (clipped), got %d", len(enriched[0].Forward))
	}
	if !enriched[0].Truncated {
		t.Errorf("expected truncated=true for clipped forward")
	}

	if stats.SampleCount != 1 {
		t.Errorf("stats.SampleCount=%d, want 1", stats.SampleCount)
	}
	if stats.LookAheadCandles != 5 {
		t.Errorf("stats.LookAheadCandles=%d, want 5", stats.LookAheadCandles)
	}
}

func TestEnrichForwardNoForwardData(t *testing.T) {
	base := time.Now()
	hist := sharesFromCloses(t, base, time.Hour, []float64{100, 101, 102})
	matches := []SimilarSlice{
		makeTestMatch(hist, 0, 3), // idx 0-2, no forward data (fwdStart=3, len=3)
	}

	enriched, _ := EnrichMatchesWithForwardData(matches, hist, 5, 10)

	if len(enriched[0].Forward) != 0 {
		t.Errorf("expected 0 forward candles, got %d", len(enriched[0].Forward))
	}
	if !enriched[0].Truncated {
		t.Errorf("expected truncated=true when no forward data exists")
	}
}

func TestEnrichForwardEmptyMatches(t *testing.T) {
	base := time.Now()
	hist := sharesFromCloses(t, base, time.Hour, []float64{100, 101, 102})

	enriched, stats := EnrichMatchesWithForwardData(nil, hist, 5, 10)
	if len(enriched) != 0 {
		t.Errorf("expected 0 enriched matches for nil input, got %d", len(enriched))
	}
	if stats.SampleCount != 0 {
		t.Errorf("expected SampleCount=0, got %d", stats.SampleCount)
	}
}

func TestEnrichForwardMaxResults(t *testing.T) {
	base := time.Now()
	hist := sharesFromCloses(t, base, time.Hour, []float64{100, 101, 102, 103, 104, 105, 106, 107, 108})
	matches := []SimilarSlice{
		makeTestMatch(hist, 0, 2),
		makeTestMatch(hist, 2, 2),
		makeTestMatch(hist, 4, 2),
	}

	enriched, stats := EnrichMatchesWithForwardData(matches, hist, 2, 2)
	if len(enriched) != 2 {
		t.Errorf("expected 2 matches (maxResults=2), got %d", len(enriched))
	}
	if stats.SampleCount != 2 {
		t.Errorf("stats.SampleCount=%d, want 2", stats.SampleCount)
	}
}

func TestEnrichStatsAggregation(t *testing.T) {
	base := time.Now()
	hist := sharesFromCloses(t, base, time.Hour, []float64{
		100, 110, 115, 105, 100, 95, 90, 85, 80, 75, 70,
	})

	// Two matches that are forward slices:
	// Match 0: slice [100, 110] (idx 0-1), forward [115, 105, 100] (idx 2-4)
	// Match 1: slice [110, 115] (idx 1-2), forward [105, 100, 95]  (idx 3-5)
	matches := []SimilarSlice{
		{
			Similarity: 0.9,
			Slice:      hist[0:2],
			startIdx:   0,
		},
		{
			Similarity: 0.8,
			Slice:      hist[1:3],
			startIdx:   1,
		},
	}

	enriched, stats := EnrichMatchesWithForwardData(matches, hist, 3, 10)

	if stats.SampleCount != 2 {
		t.Errorf("stats.SampleCount=%d, want 2", stats.SampleCount)
	}
	if stats.LookAheadCandles != 3 {
		t.Errorf("stats.LookAheadCandles=%d, want 3", stats.LookAheadCandles)
	}

	// Match 0 forwardReturn = (100-110)/110 = -0.0909...
	// Match 1 forwardReturn = (95-115)/115 = -0.1739...
	fwdRet0 := (hist[4].Data.Close - hist[1].Data.Close) / hist[1].Data.Close
	fwdRet1 := (hist[5].Data.Close - hist[2].Data.Close) / hist[2].Data.Close

	if !almostEqual(enriched[0].ForwardReturn, fwdRet0, 1e-9) {
		t.Errorf("match 0 forwardReturn=%v, want %v", enriched[0].ForwardReturn, fwdRet0)
	}
	if !almostEqual(enriched[1].ForwardReturn, fwdRet1, 1e-9) {
		t.Errorf("match 1 forwardReturn=%v, want %v", enriched[1].ForwardReturn, fwdRet1)
	}

	if stats.PctHigher != 0 {
		t.Errorf("stats.PctHigher=%v, want 0 (both forward returns are negative)", stats.PctHigher)
	}
	expectedMean := (fwdRet0 + fwdRet1) / 2
	if !almostEqual(stats.MeanReturn, expectedMean, 1e-9) {
		t.Errorf("stats.MeanReturn=%v, want %v", stats.MeanReturn, expectedMean)
	}
	if stats.BestReturn != fwdRet0 {
		t.Errorf("stats.BestReturn=%v, want %v (least negative)", stats.BestReturn, fwdRet0)
	}
	if stats.WorstReturn != fwdRet1 {
		t.Errorf("stats.WorstReturn=%v, want %v (most negative)", stats.WorstReturn, fwdRet1)
	}

	if len(stats.MedianPath) != 3 {
		t.Errorf("len(stats.MedianPath)=%d, want 3", len(stats.MedianPath))
	}
}

func TestRangesOverlapAndOverlapAmount(t *testing.T) {
	if !rangesOverlap(0, 5, 3, 8) {
		t.Errorf("expected overlap")
	}
	if rangesOverlap(0, 5, 6, 10) {
		t.Errorf("expected no overlap for adjacent ranges")
	}
	if got := overlapAmount(0, 5, 3, 8); got != 3 {
		t.Errorf("overlapAmount(0,5,3,8) = %d, want 3", got)
	}
	if got := overlapAmount(0, 5, 6, 10); got != 0 {
		t.Errorf("overlapAmount(0,5,6,10) = %d, want 0", got)
	}
}
