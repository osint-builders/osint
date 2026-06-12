package cmd

import (
	"os"

	"github.com/spf13/cobra"

	"github.com/osint/cli/internal/search"
)

var similarCmd = &cobra.Command{
	Use:   "similar <event-id>",
	Short: "Find events semantically similar to a given event",
	Long: `Uses pre-built embedding vectors to find the most similar events
by cosine similarity. No ML model required at runtime.`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		results, err := search.SimilarSearch(store, args[0], buildFilters(), flagLimit)
		if err != nil {
			return err
		}
		return formatter.WriteResults(os.Stdout, results)
	},
}
