package update

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

// RunHelper handles private background checks and Windows replacement. Call it
// before parsing CLI commands, and exit when handled is true.
func RunHelper(args []string) (handled bool, err error) {
	if len(args) == 0 || (args[0] != helperArg && args[0] != autoArg) {
		if runtime.GOOS == "windows" {
			cleanupHelpers()
		}
		return false, nil
	}
	if args[0] == autoArg {
		if len(args) != 2 {
			return true, errors.New("invalid automatic update arguments")
		}
		_, err := check(true, defaultConfig(args[1]))
		return true, err
	}
	if len(args) != 6 {
		return true, errors.New("invalid update helper arguments")
	}
	digest, err := parseDigest("sha256:" + args[3])
	if err != nil {
		return true, err
	}
	originalDigest, err := parseDigest("sha256:" + args[4])
	if err != nil {
		return true, err
	}
	return true, replaceAfterExit(args[1], args[2], args[5], digest, originalDigest)
}

func startBackgroundCheck(cfg config) error {
	program := cfg.exePath
	if cfg.goos == "windows" {
		var err error
		program, err = copyHelper(cfg)
		if err != nil {
			return fmt.Errorf("prepare background updater: %w", err)
		}
	}
	cmd := exec.Command(program, autoArg, cfg.exePath)
	detach(cmd)
	if err := cmd.Start(); err != nil {
		if program != cfg.exePath {
			_ = os.Remove(program)
		}
		return fmt.Errorf("start background updater: %w", err)
	}
	_ = cmd.Process.Release()
	return nil
}

func scheduleWindowsReplacement(cfg config, staged string, digest, originalDigest [sha256.Size]byte) error {
	helperPath, err := copyHelper(cfg)
	if err != nil {
		return err
	}
	cmd := exec.Command(helperPath, helperArg, cfg.exePath, staged,
		hex.EncodeToString(digest[:]), hex.EncodeToString(originalDigest[:]), cfg.cachePath)
	detach(cmd)
	if err := cmd.Start(); err != nil {
		_ = os.Remove(helperPath)
		return err
	}
	_ = cmd.Process.Release()
	return nil
}

func copyHelper(cfg config) (string, error) {
	if err := os.MkdirAll(cfg.helperDir, 0700); err != nil {
		return "", err
	}
	helper, err := os.CreateTemp(cfg.helperDir, "osintcli-update-helper-*.exe")
	if err != nil {
		return "", err
	}
	helperPath := helper.Name()
	ok := false
	defer func() {
		helper.Close()
		if !ok {
			os.Remove(helperPath)
		}
	}()
	current, err := os.Open(cfg.exePath)
	if err != nil {
		return "", err
	}
	defer current.Close()
	if _, err := io.Copy(helper, current); err != nil {
		return "", err
	}
	if err := helper.Sync(); err != nil {
		return "", err
	}
	if err := helper.Close(); err != nil {
		return "", err
	}
	ok = true
	return helperPath, nil
}

func replaceAfterExit(target, staged, cachePath string, digest, originalDigest [sha256.Size]byte) error {
	defer os.Remove(staged)
	if filepath.Clean(filepath.Dir(target)) != filepath.Clean(filepath.Dir(staged)) {
		return errors.New("staged binary must be beside the executable")
	}
	actual, err := hashFile(staged)
	if err != nil {
		return fmt.Errorf("verify staged binary: %w", err)
	}
	if actual != digest {
		return errors.New("staged binary SHA-256 mismatch")
	}

	backup, err := os.CreateTemp(filepath.Dir(target), ".osintcli-backup-*")
	if err != nil {
		return err
	}
	backupPath := backup.Name()
	if err := backup.Close(); err != nil {
		return err
	}
	if err := os.Remove(backupPath); err != nil {
		return err
	}

	// The original Windows executable remains locked until its process exits.
	deadline := time.Now().Add(2 * time.Minute)
	currentDigest, err := hashFile(target)
	if err != nil {
		return fmt.Errorf("verify current binary: %w", err)
	}
	if currentDigest == digest {
		return nil // another updater already installed this release
	}
	if currentDigest != originalDigest {
		return errors.New("CLI changed since update download")
	}
	for {
		err = os.Rename(target, backupPath)
		if err == nil {
			break
		}
		if time.Now().After(deadline) {
			return fmt.Errorf("wait for CLI to exit: %w", err)
		}
		time.Sleep(200 * time.Millisecond)
	}
	// Recheck after the rename to close the race with another update process.
	backedUpDigest, err := hashFile(backupPath)
	if err != nil || backedUpDigest != originalDigest {
		if restoreErr := os.Rename(backupPath, target); restoreErr != nil {
			return fmt.Errorf("CLI changed during update; restore previous binary: %w", restoreErr)
		}
		return errors.New("CLI changed during update")
	}
	if err := os.Rename(staged, target); err != nil {
		if restoreErr := os.Rename(backupPath, target); restoreErr != nil {
			return fmt.Errorf("install update: %v; restore previous binary: %w", err, restoreErr)
		}
		return fmt.Errorf("install update: %w", err)
	}
	_ = os.Remove(backupPath)
	if info, err := os.Stat(target); err == nil {
		writeCache(cachePath, cacheEntry{
			CheckedAt: time.Now().Unix(), Size: info.Size(),
			ModTime: info.ModTime().UnixNano(), Success: true,
		})
	}
	return nil
}

func cleanupHelpers() {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		cacheDir = os.TempDir()
	}
	paths, err := filepath.Glob(filepath.Join(cacheDir, "osintcli", "osintcli-update-helper-*.exe"))
	if err != nil {
		return
	}
	for _, path := range paths {
		if info, err := os.Stat(path); err == nil && time.Since(info.ModTime()) > 10*time.Minute {
			_ = os.Remove(path)
		}
	}
}
