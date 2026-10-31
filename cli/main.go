package main

import (
	"fmt"
	"os"

	"github.com/osint/cli/cmd"
	"github.com/osint/cli/internal/update"
)

func main() {
	if handled, err := update.RunHelper(os.Args[1:]); handled {
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}

	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
