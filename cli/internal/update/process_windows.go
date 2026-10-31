//go:build windows

package update

import (
	"os/exec"
	"syscall"
)

func detach(cmd *exec.Cmd) {
	const (
		createNewProcessGroup = 0x00000200
		createNoWindow        = 0x08000000
	)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: createNewProcessGroup | createNoWindow,
		HideWindow:    true,
	}
}
