package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var getCmd = &cobra.Command{
	Use:   "get <event-id>",
	Short: "Show full details for an event",
	Long:  `Displays the complete event record including contents markdown, links, and all metadata.`,
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		evt, ok := store.Events[args[0]]
		if !ok {
			return fmt.Errorf("event %q not found", args[0])
		}
		return formatter.WriteEvent(os.Stdout, evt)
	},
}
