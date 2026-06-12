// Package output provides formatters for rendering search results and event details.
package output

import (
	"fmt"
	"io"
	"strings"

	"github.com/osint/cli/internal/data"
	"github.com/osint/cli/internal/search"
)

// Formatter writes results in a specific format.
type Formatter interface {
	WriteResults(w io.Writer, results []search.ScoredResult) error
	WriteEvent(w io.Writer, event *data.FullEvent) error
	WriteStats(w io.Writer, schema *data.Schema, eventCount int, dateRange [2]string) error
}

// New returns a Formatter for the given format name.
func New(format string) Formatter {
	switch strings.ToLower(format) {
	case "json":
		return &JSONFormatter{}
	case "markdown", "md":
		return &MarkdownFormatter{}
	default:
		return &TableFormatter{}
	}
}

// truncate shortens s to maxLen, appending "…" if truncated.
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-1] + "…"
}

// formatConfidence returns a formatted confidence string.
func formatConfidence(c *float64) string {
	if c == nil {
		return "-"
	}
	return fmt.Sprintf("%.0f%%", *c*100)
}

// formatGeo returns a short geo string.
func formatGeo(g *data.Geo) string {
	if g == nil {
		return "-"
	}
	parts := []string{}
	if g.City != "" {
		parts = append(parts, g.City)
	}
	if g.Country != "" {
		parts = append(parts, g.Country)
	}
	if len(parts) == 0 {
		return "-"
	}
	return strings.Join(parts, ", ")
}

// dateOnly extracts YYYY-MM-DD from an ISO timestamp.
func dateOnly(s string) string {
	if len(s) >= 10 {
		return s[:10]
	}
	return s
}
