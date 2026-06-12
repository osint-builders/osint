package output

import (
	"fmt"
	"io"
	"strings"

	"github.com/osint/cli/internal/data"
	"github.com/osint/cli/internal/search"
)

// TableFormatter renders results as a compact terminal table.
type TableFormatter struct{}

func (f *TableFormatter) WriteResults(w io.Writer, results []search.ScoredResult) error {
	if len(results) == 0 {
		fmt.Fprintln(w, "No results found.")
		return nil
	}

	// Header
	fmt.Fprintf(w, "%-20s  %-10s  %-6s  %-20s  %s\n",
		"ID", "DATE", "CONF", "LOCATION", "TITLE")
	fmt.Fprintln(w, strings.Repeat("─", 100))

	for _, r := range results {
		e := r.Event
		fmt.Fprintf(w, "%-20s  %-10s  %-6s  %-20s  %s\n",
			e.ID,
			dateOnly(e.EffectiveDate()),
			formatConfidence(e.Confidence),
			truncate(formatGeo(e.Geo), 20),
			truncate(e.Title, 60),
		)
	}

	fmt.Fprintf(w, "\n%d result(s)\n", len(results))
	return nil
}

func (f *TableFormatter) WriteEvent(w io.Writer, event *data.FullEvent) error {
	fmt.Fprintf(w, "ID:        %s\n", event.ID)
	fmt.Fprintf(w, "Title:     %s\n", event.Title)
	fmt.Fprintf(w, "Source:    %s\n", event.Source.Name)
	fmt.Fprintf(w, "Published: %s\n", event.DatePublished)
	if event.DateEvent != nil && *event.DateEvent != "" {
		fmt.Fprintf(w, "Event:     %s\n", *event.DateEvent)
	}
	if event.Geo != nil {
		fmt.Fprintf(w, "Location:  %s\n", formatGeo(event.Geo))
	}
	if event.Confidence != nil {
		fmt.Fprintf(w, "Confidence: %s\n", formatConfidence(event.Confidence))
	}
	if len(event.Topics) > 0 {
		fmt.Fprintf(w, "Topics:    %s\n", strings.Join(event.Topics, ", "))
	}
	fmt.Fprintln(w)
	fmt.Fprintf(w, "Summary:\n  %s\n", event.Summary)
	fmt.Fprintln(w)
	fmt.Fprintf(w, "Contents:\n%s\n", event.Contents)

	if len(event.Links) > 0 {
		fmt.Fprintln(w)
		fmt.Fprintln(w, "Links:")
		for _, l := range event.Links {
			label := l.Label
			if label == "" {
				label = l.URL
			}
			fmt.Fprintf(w, "  - [%s] %s\n", label, l.URL)
		}
	}

	return nil
}

func (f *TableFormatter) WriteStats(w io.Writer, schema *data.Schema, eventCount int, dateRange [2]string) error {
	fmt.Fprintln(w, "OSINT CLI Index Statistics")
	fmt.Fprintln(w, strings.Repeat("─", 40))
	fmt.Fprintf(w, "Events:     %d\n", eventCount)
	fmt.Fprintf(w, "Date range: %s to %s\n", dateRange[0], dateRange[1])
	fmt.Fprintf(w, "Model:      %s\n", schema.EmbeddingModel)
	fmt.Fprintf(w, "Dimensions: %d\n", schema.EmbeddingDims)
	fmt.Fprintf(w, "Version:    %s\n", schema.Version)
	fmt.Fprintf(w, "Updated:    %s\n", schema.LastUpdated)
	return nil
}
