package cmd

import (
	"fmt"

	"github.com/osint/cli/internal/update"
	"github.com/spf13/cobra"
)

var updateCmd = &cobra.Command{
	Use:   "update",
	Short: "Download the latest CLI release",
	Args:  cobra.NoArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		result, err := update.Check(true)
		if err != nil {
			return fmt.Errorf("update failed: %w", err)
		}

		switch result.Status {
		case update.Current:
			fmt.Fprintln(cmd.OutOrStdout(), "osintcli is up to date")
		case update.Updated:
			fmt.Fprintln(cmd.OutOrStdout(), "osintcli updated; the new version will run next time")
		case update.Staged:
			fmt.Fprintln(cmd.OutOrStdout(), "osintcli update downloaded; it will install when this command exits")
		default:
			fmt.Fprintln(cmd.OutOrStdout(), "osintcli update check skipped")
		}
		return nil
	},
}
