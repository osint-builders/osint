// Package cmd implements the cobra CLI commands.
package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/osint/cli/internal/data"
	"github.com/osint/cli/internal/output"
	"github.com/osint/cli/internal/search"
)

var (
	// Shared flags
	flagFrom          string
	flagTo            string
	flagCountry       string
	flagTopics        []string
	flagSource        string
	flagMinConfidence float64
	flagSort          string
	flagLimit         int
	flagFormat        string

	// Loaded at init
	store     *data.Store
	formatter output.Formatter
)

var rootCmd = &cobra.Command{
	Use:   "osintcli",
	Short: "OSINT event search — offline CLI with embedded data and embeddings",
	Long: `osintcli bundles world-event data with pre-computed semantic embeddings
into a single binary. Search, filter, and export events without any
network connection or external dependencies.`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		// Skip data loading for help and completion
		if cmd.Name() == "help" || cmd.Name() == "completion" {
			return nil
		}

		var err error
		store, err = data.Load()
		if err != nil {
			return fmt.Errorf("failed to load embedded data: %w", err)
		}
		formatter = output.New(flagFormat)
		return nil
	},
	SilenceUsage: true,
}

func init() {
	pf := rootCmd.PersistentFlags()
	pf.StringVar(&flagFrom, "from", "", "Filter: start date (YYYY-MM-DD)")
	pf.StringVar(&flagTo, "to", "", "Filter: end date (YYYY-MM-DD)")
	pf.StringVar(&flagCountry, "country", "", "Filter: country name")
	pf.StringSliceVar(&flagTopics, "topic", nil, "Filter: topic (repeatable)")
	pf.StringVar(&flagSource, "source", "", "Filter: source name substring")
	pf.Float64Var(&flagMinConfidence, "min-confidence", 0, "Filter: minimum confidence (0.0-1.0)")
	pf.StringVar(&flagSort, "sort", "", "Sort by: date, score, confidence")
	pf.IntVar(&flagLimit, "limit", 20, "Max results to return")
	pf.StringVar(&flagFormat, "format", "table", "Output format: table, json, markdown")

	rootCmd.AddCommand(searchCmd)
	rootCmd.AddCommand(similarCmd)
	rootCmd.AddCommand(listCmd)
	rootCmd.AddCommand(getCmd)
	rootCmd.AddCommand(statsCmd)
}

// Execute runs the root command.
func Execute() error {
	return rootCmd.Execute()
}

// buildFilters constructs a Filters from the shared flag values.
func buildFilters() *search.Filters {
	return &search.Filters{
		DateFrom:      flagFrom,
		DateTo:        flagTo,
		Country:       flagCountry,
		Topics:        flagTopics,
		Source:        flagSource,
		MinConfidence: flagMinConfidence,
	}
}

// effectiveSort returns the sort flag or a default.
func effectiveSort(defaultSort string) string {
	if flagSort != "" {
		return flagSort
	}
	return defaultSort
}

func exitErr(msg string) {
	fmt.Fprintln(os.Stderr, "Error:", msg)
	os.Exit(1)
}
