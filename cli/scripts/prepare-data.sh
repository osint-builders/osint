#!/usr/bin/env bash
# prepare-data.sh — Compresses data files into cli/embed/ for go:embed.
# Run from the repository root: bash cli/scripts/prepare-data.sh
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
DATA_DIR="$REPO_ROOT/data"
EMBED_DIR="$REPO_ROOT/cli/embed"

echo "=== Preparing CLI embed data ==="
echo "Data dir:  $DATA_DIR"
echo "Embed dir: $EMBED_DIR"

mkdir -p "$EMBED_DIR"

# Compress individual index files
for file in metadata.json embeddings.bin schema.json by-topic.json by-location.json by-source.json; do
  src="$DATA_DIR/indexes/$file"
  dst="$EMBED_DIR/${file}.gz"
  if [ -f "$src" ]; then
    gzip -9 -c "$src" > "$dst"
    echo "  ✓ $file → $(du -h "$dst" | cut -f1)"
  else
    echo "  ✗ $src not found — skipping"
  fi
done

# Concatenate all JSONL event files into one, then compress
EVENTS_CONCAT="$EMBED_DIR/events.jsonl"
echo "  Concatenating JSONL files..."
find "$DATA_DIR/events" -name '*.jsonl' -type f | sort | xargs cat > "$EVENTS_CONCAT"
gzip -9 -f "$EVENTS_CONCAT"
echo "  ✓ events.jsonl.gz → $(du -h "$EMBED_DIR/events.jsonl.gz" | cut -f1)"

# Summary
echo ""
echo "=== Embed files ready ==="
ls -lh "$EMBED_DIR"/*.gz
echo ""
total=$(du -sh "$EMBED_DIR" | cut -f1)
echo "Total embed size: $total"
