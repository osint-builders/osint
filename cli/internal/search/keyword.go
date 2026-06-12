package search

import (
	"sort"
	"strings"

	"github.com/osint/cli/internal/data"
)

// ScoredResult pairs an event with its relevance score.
type ScoredResult struct {
	Event *data.EventMeta
	Score float64
}

// KeywordSearch performs weighted keyword search over metadata.
// Scoring mirrors the frontend: title 4×, topic 3×, source 2×, geo 2×, summary 1×.
func KeywordSearch(store *data.Store, query string, filters *Filters, limit int, sortBy string) []ScoredResult {
	tokens := tokenize(query)
	if len(tokens) == 0 {
		return listAll(store, filters, limit, sortBy)
	}

	var results []ScoredResult
	for i := range store.Metadata {
		e := &store.Metadata[i]
		if !MatchesFilters(e, filters) {
			continue
		}
		score := computeScore(e, tokens)
		if score > 0 {
			results = append(results, ScoredResult{Event: e, Score: score})
		}
	}

	sortResults(results, sortBy)

	if limit > 0 && len(results) > limit {
		results = results[:limit]
	}
	return results
}

// listAll returns all events matching filters, sorted by date descending.
func listAll(store *data.Store, filters *Filters, limit int, sortBy string) []ScoredResult {
	var results []ScoredResult
	for i := range store.Metadata {
		e := &store.Metadata[i]
		if !MatchesFilters(e, filters) {
			continue
		}
		results = append(results, ScoredResult{Event: e, Score: 1})
	}

	if sortBy == "" {
		sortBy = "date"
	}
	sortResults(results, sortBy)

	if limit > 0 && len(results) > limit {
		results = results[:limit]
	}
	return results
}

// ListEvents returns filtered events sorted as requested (used by the list command).
func ListEvents(store *data.Store, filters *Filters, limit int, sortBy string) []ScoredResult {
	return listAll(store, filters, limit, sortBy)
}

func computeScore(e *data.EventMeta, tokens []string) float64 {
	title := strings.ToLower(e.Title)
	summary := strings.ToLower(e.Summary)
	source := strings.ToLower(e.SourceName)

	var geoStr string
	if e.Geo != nil {
		parts := []string{e.Geo.Country, e.Geo.Region, e.Geo.City}
		var nonEmpty []string
		for _, p := range parts {
			if p != "" {
				nonEmpty = append(nonEmpty, p)
			}
		}
		geoStr = strings.ToLower(strings.Join(nonEmpty, " "))
	}

	score := 0.0
	for _, tok := range tokens {
		if strings.Contains(title, tok) {
			score += 4
		}
		if strings.Contains(summary, tok) {
			score += 1
		}
		if strings.Contains(source, tok) {
			score += 2
		}
		for _, topic := range e.Topics {
			if strings.Contains(strings.ToLower(topic), tok) {
				score += 3
				break
			}
		}
		if geoStr != "" && strings.Contains(geoStr, tok) {
			score += 2
		}
	}
	return score
}

func tokenize(query string) []string {
	raw := strings.Fields(strings.ToLower(query))
	var tokens []string
	for _, t := range raw {
		if len(t) > 1 {
			tokens = append(tokens, t)
		}
	}
	return tokens
}

func sortResults(results []ScoredResult, sortBy string) {
	switch sortBy {
	case "date":
		sort.Slice(results, func(i, j int) bool {
			return results[i].Event.EffectiveDate() > results[j].Event.EffectiveDate()
		})
	case "confidence":
		sort.Slice(results, func(i, j int) bool {
			ci, cj := 0.0, 0.0
			if results[i].Event.Confidence != nil {
				ci = *results[i].Event.Confidence
			}
			if results[j].Event.Confidence != nil {
				cj = *results[j].Event.Confidence
			}
			return ci > cj
		})
	default: // "score"
		sort.Slice(results, func(i, j int) bool {
			return results[i].Score > results[j].Score
		})
	}
}
