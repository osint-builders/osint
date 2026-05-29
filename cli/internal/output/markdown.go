package output

import (
	"fmt"
	"io"
	"strings"

	"github.com/osint/cli/internal/data"
	"github.com/osint/cli/internal/search"
)

// MarkdownFormatter renders output as Markdown.
type MarkdownFormatter struct{}

func (f *MarkdownFormatter) WriteResults(w io.Writer, results []search.ScoredResult) error {
	if len(results) == 0 {
		fmt.Fprintln(w, "No results found.")
		return nil
	}

	for i, r := range results {
		e := r.Event
		if i > 0 {
			fmt.Fprintln(w, "---")
		}
		fmt.Fprintf(w, "### %s\n", e.Title)
		fmt.Fprintf(w, "**ID:** `%s` | **Date:** %s | **Source:** %s",
			e.ID, dateOnly(e.EffectiveDate()), e.SourceName)
		if e.Confidence != nil {
			fmt.Fprintf(w, " | **Confidence:** %s", formatConfidence(e.Confidence))
		}
		fmt.Fprintln(w)
		if e.Geo != nil {
			geo := formatGeo(e.Geo)
			if geo != "-" {
				fmt.Fprintf(w, "**Location:** %s\n", geo)
			}
		}
		if len(e.Topics) > 0 {
			fmt.Fprintf(w, "**Topics:** %s\n", strings.Join(e.Topics, ", "))
		}
		fmt.Fprintf(w, "\n> %s\n\n", e.Summary)
	}

	fmt.Fprintf(w, "*%d result(s)*\n", len(results))
	return nil
}

func (f *MarkdownFormatter) WriteEvent(w io.Writer, event *data.FullEvent) error {
	fmt.Fprintf(w, "# %s\n\n", event.Title)
	fmt.Fprintf(w, "- **ID:** `%s`\n", event.ID)
	fmt.Fprintf(w, "- **Source:** %s\n", event.Source.Name)
	fmt.Fprintf(w, "- **Published:** %s\n", event.DatePublished)
	if event.DateEvent != nil && *event.DateEvent != "" {
		fmt.Fprintf(w, "- **Event date:** %s\n", *event.DateEvent)
	}
	if event.Geo != nil {
		geo := formatGeo(event.Geo)
		if geo != "-" {
			fmt.Fprintf(w, "- **Location:** %s\n", geo)
		}
	}
	if event.Confidence != nil {
		fmt.Fprintf(w, "- **Confidence:** %s\n", formatConfidence(event.Confidence))
	}
	if len(event.Topics) > 0 {
		fmt.Fprintf(w, "- **Topics:** %s\n", strings.Join(event.Topics, ", "))
	}

	fmt.Fprintf(w, "\n## Summary\n\n%s\n", event.Summary)
	fmt.Fprintf(w, "\n## Contents\n\n%s\n", event.Contents)

	if len(event.Links) > 0 {
		fmt.Fprintf(w, "\n## Links\n\n")
		for _, l := range event.Links {
			label := l.Label
			if label == "" {
				label = l.URL
			}
			fmt.Fprintf(w, "- [%s](%s)\n", label, l.URL)
		}
	}

	return nil
}

func (f *MarkdownFormatter) WriteStats(w io.Writer, schema *data.Schema, eventCount int, dateRange [2]string) error {
	fmt.Fprintln(w, "# OSINT CLI Index Statistics\n")
	fmt.Fprintf(w, "- **Events:** %d\n", eventCount)
	fmt.Fprintf(w, "- **Date range:** %s to %s\n", dateRange[0], dateRange[1])
	fmt.Fprintf(w, "- **Model:** %s\n", schema.EmbeddingModel)
	fmt.Fprintf(w, "- **Dimensions:** %d\n", schema.EmbeddingDims)
	fmt.Fprintf(w, "- **Version:** %s\n", schema.Version)
	fmt.Fprintf(w, "- **Updated:** %s\n", schema.LastUpdated)
	return nil
}
