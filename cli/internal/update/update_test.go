package update

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func testConfig(t *testing.T, handler http.HandlerFunc, current []byte) (config, *httptest.Server) {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	dir := t.TempDir()
	exe := filepath.Join(dir, "osintcli-test")
	if err := os.WriteFile(exe, current, 0755); err != nil {
		t.Fatal(err)
	}
	return config{
		apiURL:       server.URL + "/api",
		downloadBase: server.URL + "/download/",
		exePath:      exe,
		cachePath:    filepath.Join(dir, "cache", "update.json"),
		helperDir:    filepath.Join(dir, "cache"),
		goos:         runtime.GOOS,
		goarch:       runtime.GOARCH,
		now:          time.Now,
		metaClient:   server.Client(),
		fileClient:   server.Client(),
	}, server
}

func assetName() string {
	name := "osintcli-" + runtime.GOOS + "-" + runtime.GOARCH
	if runtime.GOOS == "windows" {
		name += ".exe"
	}
	return name
}

func releaseJSON(t *testing.T, binary []byte, digest string) []byte {
	t.Helper()
	b, err := json.Marshal(release{
		TagName: releaseTag,
		Assets:  []asset{{Name: assetName(), Size: int64(len(binary)), Digest: digest}},
	})
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func digestText(data []byte) string {
	sum := sha256.Sum256(data)
	return "sha256:" + hex.EncodeToString(sum[:])
}

func TestCurrentReleaseIsCached(t *testing.T) {
	binary := []byte("already current")
	var requests atomic.Int32
	cfg, _ := testConfig(t, func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		if r.URL.Path != "/api" {
			t.Errorf("unexpected request %s", r.URL.Path)
		}
		w.Write(releaseJSON(t, binary, digestText(binary)))
	}, binary)

	result, err := check(false, cfg)
	if err != nil || result.Status != Current {
		t.Fatalf("first check = %#v, %v", result, err)
	}
	result, err = check(false, cfg)
	if err != nil || result.Status != Skipped {
		t.Fatalf("cached check = %#v, %v", result, err)
	}
	if requests.Load() != 1 {
		t.Fatalf("got %d release requests, want 1", requests.Load())
	}
}

func TestSuccessfulUnixDownloadSelectsExactAsset(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Unix replaces the running executable directly; Windows uses the deferred helper")
	}
	oldBinary := []byte("old binary")
	newBinary := []byte("new binary")
	var downloads atomic.Int32
	cfg, _ := testConfig(t, func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api":
			b, err := json.Marshal(release{
				TagName: releaseTag,
				Assets: []asset{
					{Name: assetName() + ".old", Size: 1, Digest: digestText([]byte("x"))},
					{Name: assetName(), Size: int64(len(newBinary)), Digest: digestText(newBinary)},
				},
			})
			if err != nil {
				t.Error(err)
			}
			w.Write(b)
		case "/download/" + assetName():
			downloads.Add(1)
			w.Write(newBinary)
		default:
			http.NotFound(w, r)
		}
	}, oldBinary)

	result, err := check(true, cfg)
	if err != nil || result.Status != Updated {
		t.Fatalf("update = %#v, %v", result, err)
	}
	actual, err := os.ReadFile(cfg.exePath)
	if err != nil || string(actual) != string(newBinary) {
		t.Fatalf("installed binary = %q, %v", actual, err)
	}
	if downloads.Load() != 1 {
		t.Fatalf("got %d downloads, want 1", downloads.Load())
	}
	result, err = check(false, cfg)
	if err != nil || result.Status != Skipped {
		t.Fatalf("updated binary was not cached: %#v, %v", result, err)
	}
}

func TestDownloadMismatchPreservesExecutable(t *testing.T) {
	oldBinary := []byte("old binary")
	newBinary := []byte("new binary")
	cfg, _ := testConfig(t, func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api":
			w.Write(releaseJSON(t, newBinary, digestText(newBinary)))
		case "/download/" + assetName():
			w.Write([]byte("bad binary")) // same length, wrong digest
		default:
			http.NotFound(w, r)
		}
	}, oldBinary)

	_, err := check(true, cfg)
	if err == nil || !strings.Contains(err.Error(), "SHA-256 mismatch") {
		t.Fatalf("check error = %v, want SHA-256 mismatch", err)
	}
	actual, err := os.ReadFile(cfg.exePath)
	if err != nil || string(actual) != string(oldBinary) {
		t.Fatalf("executable changed after failed download: %q, %v", actual, err)
	}
	staged, err := filepath.Glob(filepath.Join(filepath.Dir(cfg.exePath), ".osintcli-update-*"))
	if err != nil || len(staged) != 0 {
		t.Fatalf("left staging files: %v, %v", staged, err)
	}
}

func TestMissingDigestRejectsRelease(t *testing.T) {
	var requestedDownload atomic.Bool
	cfg, _ := testConfig(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api" {
			w.Write(releaseJSON(t, []byte("new binary"), ""))
			return
		}
		requestedDownload.Store(true)
	}, []byte("old binary"))

	_, err := check(true, cfg)
	if err == nil || !strings.Contains(err.Error(), "missing SHA-256") {
		t.Fatalf("check error = %v, want missing digest", err)
	}
	if requestedDownload.Load() {
		t.Fatal("downloaded asset with no digest")
	}
}

func TestFailedCheckIsThrottledButForceRetries(t *testing.T) {
	var requests atomic.Int32
	cfg, _ := testConfig(t, func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		http.Error(w, "failed", http.StatusServiceUnavailable)
	}, []byte("old binary"))

	if _, err := check(false, cfg); err == nil {
		t.Fatal("expected release error")
	}
	result, err := check(false, cfg)
	if err != nil || result.Status != Skipped {
		t.Fatalf("cached failure = %#v, %v", result, err)
	}
	if _, err := check(true, cfg); err == nil {
		t.Fatal("forced check should retry and fail")
	}
	if requests.Load() != 2 {
		t.Fatalf("got %d requests, want 2", requests.Load())
	}
}

func TestReplaceAfterExitVerifiesAndInstalls(t *testing.T) {
	dir := t.TempDir()
	target := filepath.Join(dir, "osintcli.exe")
	staged := filepath.Join(dir, ".osintcli-update-test")
	cachePath := filepath.Join(dir, "update.json")
	oldBinary := []byte("old binary")
	newBinary := []byte("new binary")
	if err := os.WriteFile(target, oldBinary, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(staged, newBinary, 0755); err != nil {
		t.Fatal(err)
	}
	if err := replaceAfterExit(target, staged, cachePath, sha256.Sum256(newBinary), sha256.Sum256(oldBinary)); err != nil {
		t.Fatal(err)
	}
	actual, err := os.ReadFile(target)
	if err != nil || string(actual) != string(newBinary) {
		t.Fatalf("installed binary = %q, %v", actual, err)
	}
	if _, err := os.Stat(staged); !os.IsNotExist(err) {
		t.Fatalf("staging file remains: %v", err)
	}
	info, err := os.Stat(target)
	if err != nil || !cacheFresh(cachePath, info, time.Now()) {
		t.Fatalf("successful replacement was not cached: %v", err)
	}
}

func TestReplaceAfterExitRejectsChangedExecutable(t *testing.T) {
	dir := t.TempDir()
	target := filepath.Join(dir, "osintcli.exe")
	staged := filepath.Join(dir, ".osintcli-update-test")
	if err := os.WriteFile(target, []byte("another update"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(staged, []byte("new binary"), 0755); err != nil {
		t.Fatal(err)
	}
	err := replaceAfterExit(target, staged, filepath.Join(dir, "update.json"),
		sha256.Sum256([]byte("new binary")), sha256.Sum256([]byte("old binary")))
	if err == nil || !strings.Contains(err.Error(), "changed since") {
		t.Fatalf("replacement error = %v, want changed binary", err)
	}
	actual, err := os.ReadFile(target)
	if err != nil || string(actual) != "another update" {
		t.Fatalf("executable changed after stale update: %q, %v", actual, err)
	}
}
