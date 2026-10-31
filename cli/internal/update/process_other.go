//go:build !windows && !linux && !darwin

package update

import "os/exec"

func detach(cmd *exec.Cmd) {}
