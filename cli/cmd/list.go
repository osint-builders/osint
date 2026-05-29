package cmd

import (
	"os"

	"github.com/spf13/cobra"

	"github.com/osint/cli/internal/search"
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List events with optional filters",
	Long: `Browse all events sorted by date (newest first).
Use --from, --to, --country, --topic, --source to narrow results.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		results := search.ListEvents(store, buildFilters(), flagLimit, effectiveSort("date"))
		return formatter.WriteResults(os.Stdout, results)
	},
}
