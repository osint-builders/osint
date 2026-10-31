#!/usr/bin/env bash
# Remove daily event files older than the 90-day UTC date cutoff.
set -euo pipefail

RETENTION_DAYS=90
DATA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVENTS_DIR="$DATA_DIR/events"
DRY_RUN=false

case "${1:-}" in
  "") ;;
  --dry-run) DRY_RUN=true ;;
  --help|-h)
    echo "Usage: $0 [--dry-run]"
    exit 0
    ;;
  *)
    echo "Usage: $0 [--dry-run]" >&2
    exit 2
    ;;
esac
if [ "$#" -gt 1 ]; then
  echo "Usage: $0 [--dry-run]" >&2
  exit 2
fi

# Daily files use YYYY-MM-DD names. RETENTION_TODAY keeps the boundary
# deterministic in tests; production always uses the current UTC date.
today="${RETENTION_TODAY:-$(date -u +%Y-%m-%d)}"
if [[ ! "$today" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "RETENTION_TODAY must use YYYY-MM-DD" >&2
  exit 2
fi
if [[ "$OSTYPE" == darwin* ]]; then
  cutoff=$(date -u -j -f '%Y-%m-%d' "$today" -v-"${RETENTION_DAYS}"d +%Y-%m-%d)
else
  cutoff=$(date -u -d "$today $RETENTION_DAYS days ago" +%Y-%m-%d)
fi

echo "Retention cutoff: $cutoff (keeping files dated on or after this day)"
if [ ! -d "$EVENTS_DIR" ]; then
  echo "No event directory found."
  exit 0
fi

removed=0
for month_dir in "$EVENTS_DIR"/????-??; do
  [ -d "$month_dir" ] || continue
  for event_file in "$month_dir"/????-??-??.jsonl; do
    [ -f "$event_file" ] || continue
    event_date="$(basename "$event_file" .jsonl)"
    [[ "$event_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || continue
    if [[ "$event_date" < "$cutoff" ]]; then
      if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] Would remove: $event_file"
      else
        echo "Removing: $event_file"
        rm -- "$event_file"
      fi
      removed=$((removed + 1))
    fi
  done
  if [ "$DRY_RUN" = false ]; then
    # Only an empty month directory can be removed; no recursive delete.
    rmdir -- "$month_dir" 2>/dev/null || true
  fi
done

echo "Expired daily files: $removed"
echo "Rebuild indexes and data/stats.json from the retained event files next."
