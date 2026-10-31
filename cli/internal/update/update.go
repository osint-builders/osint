// Package update keeps released CLI binaries current without affecting offline queries.
package update

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	releaseTag      = "cli-latest"
	releaseAPI      = "https://api.github.com/repos/osint-builders/osint/releases/tags/cli-latest"
	downloadBase    = "https://github.com/osint-builders/osint/releases/download/cli-latest/"
	successInterval = 24 * time.Hour
	failureInterval = time.Hour
	helperArg       = "--osintcli-update-helper"
	autoArg         = "--osintcli-auto-update"
)

// BuildChannel is set to "release" in published binaries via go build -ldflags.
var BuildChannel = "development"

const (
	Current = "current"
	Updated = "updated"
	Staged  = "staged"
	Skipped = "skipped"
)

// Result describes the outcome of an update check.
type Result struct {
	Status string
}

// ReleaseBuild reports whether this binary came from the release workflow.
func ReleaseBuild() bool { return BuildChannel == "release" }

// StartAutomatic performs only local work in the caller. A detached process
// checks and installs the release while the command continues.
func StartAutomatic() error {
	if !ReleaseBuild() {
		return nil
	}
	exe, err := runningExecutable()
	if err != nil {
		return err
	}
	cfg := defaultConfig(exe)
	info, err := os.Stat(exe)
	if err != nil {
		return err
	}
	if cacheFresh(cfg.cachePath, info, cfg.now()) {
		return nil
	}
	// Reserve a short retry interval before launching to avoid duplicate checks
	// when several CLI commands start at once.
	writeCache(cfg.cachePath, cacheEntry{
		CheckedAt: cfg.now().Unix(), Size: info.Size(),
		ModTime: info.ModTime().UnixNano(), Success: false,
	})
	return startBackgroundCheck(cfg)
}

type release struct {
	TagName string  `json:"tag_name"`
	Assets  []asset `json:"assets"`
}

type asset struct {
	Name   string `json:"name"`
	Size   int64  `json:"size"`
	Digest string `json:"digest"`
}

type cacheEntry struct {
	CheckedAt int64 `json:"checked_at"`
	Size      int64 `json:"size"`
	ModTime   int64 `json:"mod_time"`
	Success   bool  `json:"success"`
}

type config struct {
	apiURL       string
	downloadBase string
	exePath      string
	cachePath    string
	helperDir    string
	goos         string
	goarch       string
	now          func() time.Time
	metaClient   *http.Client
	fileClient   *http.Client
}

// Check checks the CLI release and installs a verified binary when one is available.
// Automatic checks are cached; force bypasses the cache and also works in local builds.
func Check(force bool) (Result, error) {
	if !force && !ReleaseBuild() {
		return Result{Status: Skipped}, nil
	}
	exe, err := runningExecutable()
	if err != nil {
		return Result{}, err
	}
	return check(force, defaultConfig(exe))
}

func runningExecutable() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("find running executable: %w", err)
	}
	exe, err = filepath.EvalSymlinks(exe)
	if err != nil {
		return "", fmt.Errorf("resolve running executable: %w", err)
	}
	return exe, nil
}

func defaultConfig(exe string) config {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		cacheDir = os.TempDir()
	}
	cacheDir = filepath.Join(cacheDir, "osintcli")
	pathKey := sha256.Sum256([]byte(exe))
	return config{
		apiURL:       releaseAPI,
		downloadBase: downloadBase,
		exePath:      exe,
		cachePath:    filepath.Join(cacheDir, "update-"+hex.EncodeToString(pathKey[:8])+".json"),
		helperDir:    cacheDir,
		goos:         runtime.GOOS,
		goarch:       runtime.GOARCH,
		now:          time.Now,
		metaClient:   &http.Client{Timeout: 3 * time.Second},
		fileClient:   &http.Client{Timeout: 2 * time.Minute},
	}
}

func check(force bool, cfg config) (Result, error) {
	info, err := os.Stat(cfg.exePath)
	if err != nil {
		return Result{}, fmt.Errorf("stat running executable: %w", err)
	}
	if !force && cacheFresh(cfg.cachePath, info, cfg.now()) {
		return Result{Status: Skipped}, nil
	}

	result, err := checkRelease(cfg, info.Mode().Perm())
	if err != nil {
		writeCache(cfg.cachePath, cacheEntry{
			CheckedAt: cfg.now().Unix(), Size: info.Size(),
			ModTime: info.ModTime().UnixNano(), Success: false,
		})
		return Result{}, err
	}
	if result.Status == Current || result.Status == Updated {
		if info, statErr := os.Stat(cfg.exePath); statErr == nil {
			writeCache(cfg.cachePath, cacheEntry{
				CheckedAt: cfg.now().Unix(), Size: info.Size(),
				ModTime: info.ModTime().UnixNano(), Success: true,
			})
		}
	}
	return result, nil
}

func checkRelease(cfg config, mode os.FileMode) (Result, error) {
	rel, err := fetchRelease(cfg)
	if err != nil {
		return Result{}, err
	}
	name := "osintcli-" + cfg.goos + "-" + cfg.goarch
	if cfg.goos == "windows" {
		name += ".exe"
	}
	var selected *asset
	for i := range rel.Assets {
		if rel.Assets[i].Name == name {
			selected = &rel.Assets[i]
			break
		}
	}
	if selected == nil {
		return Result{}, fmt.Errorf("release %s has no binary for %s/%s", releaseTag, cfg.goos, cfg.goarch)
	}
	digest, err := parseDigest(selected.Digest)
	if err != nil {
		return Result{}, fmt.Errorf("release asset %s: %w", name, err)
	}
	if selected.Size <= 0 {
		return Result{}, fmt.Errorf("release asset %s has invalid size", name)
	}
	currentDigest, err := hashFile(cfg.exePath)
	if err != nil {
		return Result{}, fmt.Errorf("hash running executable: %w", err)
	}
	if currentDigest == digest {
		return Result{Status: Current}, nil
	}

	staged, err := download(cfg, name, selected.Size, digest, mode)
	if err != nil {
		return Result{}, err
	}
	if cfg.goos == "windows" {
		if err := scheduleWindowsReplacement(cfg, staged, digest, currentDigest); err != nil {
			os.Remove(staged)
			return Result{}, fmt.Errorf("stage Windows update: %w", err)
		}
		return Result{Status: Staged}, nil
	}
	// A second updater may have installed another release while this download
	// was in progress. Do not replace a binary that changed underneath us.
	beforeReplace, err := hashFile(cfg.exePath)
	if err != nil {
		os.Remove(staged)
		return Result{}, fmt.Errorf("verify current binary: %w", err)
	}
	if beforeReplace != currentDigest {
		os.Remove(staged)
		return Result{}, errors.New("CLI changed during update download")
	}
	if err := os.Rename(staged, cfg.exePath); err != nil {
		os.Remove(staged)
		return Result{}, fmt.Errorf("replace executable: %w", err)
	}
	return Result{Status: Updated}, nil
}

func fetchRelease(cfg config) (release, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, cfg.apiURL, nil)
	if err != nil {
		return release{}, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "osintcli-updater")
	resp, err := cfg.metaClient.Do(req)
	if err != nil {
		return release{}, fmt.Errorf("check CLI release: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return release{}, fmt.Errorf("check CLI release: HTTP %d", resp.StatusCode)
	}
	var rel release
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&rel); err != nil {
		return release{}, fmt.Errorf("read CLI release: %w", err)
	}
	if rel.TagName != releaseTag {
		return release{}, fmt.Errorf("unexpected CLI release tag %q", rel.TagName)
	}
	return rel, nil
}

func parseDigest(value string) ([sha256.Size]byte, error) {
	var result [sha256.Size]byte
	hexDigest, ok := strings.CutPrefix(value, "sha256:")
	if !ok || len(hexDigest) != sha256.Size*2 {
		return result, errors.New("missing SHA-256 digest")
	}
	b, err := hex.DecodeString(hexDigest)
	if err != nil {
		return result, fmt.Errorf("invalid SHA-256 digest: %w", err)
	}
	copy(result[:], b)
	return result, nil
}

func hashFile(path string) ([sha256.Size]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return [sha256.Size]byte{}, err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return [sha256.Size]byte{}, err
	}
	var digest [sha256.Size]byte
	copy(digest[:], h.Sum(nil))
	return digest, nil
}

func download(cfg config, name string, size int64, digest [sha256.Size]byte, mode os.FileMode) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, cfg.downloadBase+name, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "osintcli-updater")
	resp, err := cfg.fileClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("download CLI binary: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download CLI binary: HTTP %d", resp.StatusCode)
	}
	f, err := os.CreateTemp(filepath.Dir(cfg.exePath), ".osintcli-update-*")
	if err != nil {
		return "", fmt.Errorf("create update file beside executable: %w", err)
	}
	path := f.Name()
	ok := false
	defer func() {
		f.Close()
		if !ok {
			os.Remove(path)
		}
	}()
	h := sha256.New()
	n, err := io.Copy(io.MultiWriter(f, h), io.LimitReader(resp.Body, size+1))
	if err != nil {
		return "", fmt.Errorf("write CLI binary: %w", err)
	}
	if n != size {
		return "", fmt.Errorf("CLI binary size mismatch: expected %d bytes, got %d", size, n)
	}
	if !equalDigest(h.Sum(nil), digest) {
		return "", errors.New("CLI binary SHA-256 mismatch")
	}
	if err := f.Chmod(mode); err != nil {
		return "", fmt.Errorf("make CLI binary executable: %w", err)
	}
	if err := f.Sync(); err != nil {
		return "", fmt.Errorf("sync CLI binary: %w", err)
	}
	if err := f.Close(); err != nil {
		return "", fmt.Errorf("close CLI binary: %w", err)
	}
	ok = true
	return path, nil
}

func equalDigest(actual []byte, expected [sha256.Size]byte) bool {
	if len(actual) != len(expected) {
		return false
	}
	for i, b := range actual {
		if b != expected[i] {
			return false
		}
	}
	return true
}

func cacheFresh(path string, exe os.FileInfo, now time.Time) bool {
	b, err := os.ReadFile(path)
	if err != nil {
		return false
	}
	var entry cacheEntry
	if json.Unmarshal(b, &entry) != nil || entry.Size != exe.Size() || entry.ModTime != exe.ModTime().UnixNano() {
		return false
	}
	interval := failureInterval
	if entry.Success {
		interval = successInterval
	}
	age := now.Sub(time.Unix(entry.CheckedAt, 0))
	return age >= 0 && age < interval
}

func writeCache(path string, entry cacheEntry) {
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return
	}
	b, err := json.Marshal(entry)
	if err == nil {
		_ = os.WriteFile(path, b, 0600)
	}
}
