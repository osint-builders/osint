package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

var statsCmd = &cobra.Command{
	Use:   "stats",
	Short: "Show index statistics",
	Long:  `Displays event count, date range, embedding model, and last-updated timestamp.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		// Compute date range from metadata
		var earliest, latest string
		for _, m := range store.Metadata {
			d := m.EffectiveDate()
			if d == "" {
				continue
			}
			dateOnly := d
			if len(dateOnly) > 10 {
				dateOnly = dateOnly[:10]
			}
			if earliest == "" || dateOnly < earliest {
				earliest = dateOnly
			}
			if latest == "" || dateOnly > latest {
				latest = dateOnly
			}
		}

		return formatter.WriteStats(os.Stdout, &store.Schema, len(store.Metadata), [2]string{earliest, latest})
	},
}
