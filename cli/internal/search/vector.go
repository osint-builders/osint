package search

import (
	"fmt"
	"math"
	"sort"

	"github.com/osint/cli/internal/data"
)

// SimilarSearch finds the top-K most similar events to a given event ID
// using cosine similarity on pre-built embeddings.
func SimilarSearch(store *data.Store, eventID string, filters *Filters, limit int) ([]ScoredResult, error) {
	idx, ok := store.IDToIndex[eventID]
	if !ok {
		return nil, fmt.Errorf("event ID %q not found", eventID)
	}

	dims := store.Dims
	queryVec := store.Embeddings[idx*dims : (idx+1)*dims]

	type scored struct {
		index int
		score float64
	}

	var candidates []scored
	for i := range store.Metadata {
		if i == idx {
			continue // skip self
		}
		e := &store.Metadata[i]
		if !MatchesFilters(e, filters) {
			continue
		}
		vec := store.Embeddings[i*dims : (i+1)*dims]
		sim := dotProduct(queryVec, vec)
		candidates = append(candidates, scored{index: i, score: float64(sim)})
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].score > candidates[j].score
	})

	if limit > 0 && len(candidates) > limit {
		candidates = candidates[:limit]
	}

	results := make([]ScoredResult, len(candidates))
	for i, c := range candidates {
		results[i] = ScoredResult{
			Event: &store.Metadata[c.index],
			Score: c.score,
		}
	}
	return results, nil
}

func dotProduct(a, b []float32) float32 {
	var sum float32
	for i := range a {
		sum += a[i] * b[i]
	}
	return sum
}

// Norm computes the L2 norm of a vector.
func Norm(v []float32) float32 {
	var sum float32
	for _, x := range v {
		sum += x * x
	}
	return float32(math.Sqrt(float64(sum)))
}
