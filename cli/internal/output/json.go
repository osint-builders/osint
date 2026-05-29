package output

import (
	"encoding/json"
	"io"

	"github.com/osint/cli/internal/data"
	"github.com/osint/cli/internal/search"
)

// JSONFormatter renders output as JSON.
type JSONFormatter struct{}

func (f *JSONFormatter) WriteResults(w io.Writer, results []search.ScoredResult) error {
	type entry struct {
		ID            string   `json:"id"`
		Title         string   `json:"title"`
		Summary       string   `json:"summary"`
		DatePublished string   `json:"date_published"`
		DateEvent     *string  `json:"date_event,omitempty"`
		SourceName    string   `json:"source_name"`
		Country       string   `json:"country,omitempty"`
		Topics        []string `json:"topics,omitempty"`
		Confidence    *float64 `json:"confidence,omitempty"`
		Score         float64  `json:"score"`
	}

	entries := make([]entry, len(results))
	for i, r := range results {
		e := r.Event
		country := ""
		if e.Geo != nil {
			country = e.Geo.Country
		}
		entries[i] = entry{
			ID:            e.ID,
			Title:         e.Title,
			Summary:       e.Summary,
			DatePublished: e.DatePublished,
			DateEvent:     e.DateEvent,
			SourceName:    e.SourceName,
			Country:       country,
			Topics:        e.Topics,
			Confidence:    e.Confidence,
			Score:         r.Score,
		}
	}

	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	return enc.Encode(entries)
}

func (f *JSONFormatter) WriteEvent(w io.Writer, event *data.FullEvent) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	return enc.Encode(event)
}

func (f *JSONFormatter) WriteStats(w io.Writer, schema *data.Schema, eventCount int, dateRange [2]string) error {
	stats := map[string]interface{}{
		"event_count":     eventCount,
		"date_range":      dateRange,
		"embedding_model": schema.EmbeddingModel,
		"embedding_dims":  schema.EmbeddingDims,
		"version":         schema.Version,
		"last_updated":    schema.LastUpdated,
	}
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(stats)
}
