// Package search provides keyword and vector search over embedded OSINT data.
package search

import (
	"strings"

	"github.com/osint/cli/internal/data"
)

// Filters holds the user-specified filter criteria.
type Filters struct {
	DateFrom      string
	DateTo        string
	Country       string
	Topics        []string
	Source        string
	MinConfidence float64
}

// MatchesFilters returns true if the event passes all active filters.
func MatchesFilters(e *data.EventMeta, f *Filters) bool {
	if f.DateFrom != "" || f.DateTo != "" {
		dateStr := e.EffectiveDate()
		if dateStr == "" {
			return false
		}
		dateOnly := dateStr
		if len(dateOnly) > 10 {
			dateOnly = dateOnly[:10]
		}
		if f.DateFrom != "" && dateOnly < f.DateFrom {
			return false
		}
		if f.DateTo != "" && dateOnly > f.DateTo {
			return false
		}
	}

	if f.Country != "" {
		if e.Geo == nil || !strings.EqualFold(e.Geo.Country, f.Country) {
			return false
		}
	}

	if len(f.Topics) > 0 {
		matched := false
		for _, ft := range f.Topics {
			for _, et := range e.Topics {
				if strings.EqualFold(et, ft) {
					matched = true
					break
				}
			}
			if matched {
				break
			}
		}
		if !matched {
			return false
		}
	}

	if f.Source != "" {
		if !strings.Contains(strings.ToLower(e.SourceName), strings.ToLower(f.Source)) {
			return false
		}
	}

	if f.MinConfidence > 0 {
		conf := 0.0
		if e.Confidence != nil {
			conf = *e.Confidence
		}
		if conf < f.MinConfidence {
			return false
		}
	}

	return true
}
