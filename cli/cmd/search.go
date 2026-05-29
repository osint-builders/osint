package cmd

import (
	"os"
	"strings"

	"github.com/spf13/cobra"

	"github.com/osint/cli/internal/search"
)

var searchCmd = &cobra.Command{
	Use:   "search [query...]",
	Short: "Keyword search across events",
	Long: `Search events by keyword with weighted scoring.
Weights: title 4×, topic 3×, source 2×, geo 2×, summary 1×.
Combine with --from, --to, --country, --topic, --source, --min-confidence to filter.`,
	Args: cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		query := strings.Join(args, " ")
		results := search.KeywordSearch(store, query, buildFilters(), flagLimit, effectiveSort("score"))
		return formatter.WriteResults(os.Stdout, results)
	},
}
