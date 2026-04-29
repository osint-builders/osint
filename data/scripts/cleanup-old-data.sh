#!/bin/bash

# cleanup-old-data.sh
# Remove world event data and media older than retention period (90 days)

set -euo pipefail

# Configuration
RETENTION_DAYS=90
DRY_RUN=false
DATA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVENTS_DIR="$DATA_DIR/events"
MEDIA_DIR="$DATA_DIR/media"
MANIFEST_FILE="$DATA_DIR/manifest.json"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--dry-run]"
      echo ""
      echo "Remove event data and media older than $RETENTION_DAYS days"
      echo ""
      echo "Options:"
      echo "  --dry-run    Show what would be deleted without actually deleting"
      echo "  --help, -h   Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Calculate cutoff date (90 days ago)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  CUTOFF_DATE=$(date -v-${RETENTION_DAYS}d +%Y-%m-%d)
  CUTOFF_MONTH=$(date -v-${RETENTION_DAYS}d +%Y-%m)
else
  # Linux
  CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
  CUTOFF_MONTH=$(date -d "$RETENTION_DAYS days ago" +%Y-%m)
fi

echo "=== Data Cleanup ==="
echo "Retention period: $RETENTION_DAYS days"
echo "Cutoff date: $CUTOFF_DATE"
echo "Cutoff month: $CUTOFF_MONTH"
echo "Dry run: $DRY_RUN"
echo ""

# Function to remove old month folders
remove_old_months() {
  local base_dir=$1
  local type=$2

  if [ ! -d "$base_dir" ]; then
    echo "Directory not found: $base_dir"
    return
  fi

  echo "Scanning $type..."

  # Find all month folders (YYYY-MM format)
  find "$base_dir" -mindepth 1 -maxdepth 1 -type d -name "????-??" | while read -r month_dir; do
    month=$(basename "$month_dir")

    # Compare month to cutoff
    if [[ "$month" < "$CUTOFF_MONTH" ]]; then
      if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] Would remove: $month_dir"

        # Count files for reporting
        if [ "$type" = "events" ]; then
          file_count=$(find "$month_dir" -name "*.jsonl" | wc -l | tr -d ' ')
          echo "           Contains: $file_count JSONL files"
        else
          file_count=$(find "$month_dir" -type f | wc -l | tr -d ' ')
          dir_size=$(du -sh "$month_dir" | cut -f1)
          echo "           Contains: $file_count files ($dir_size)"
        fi
      else
        echo "Removing: $month_dir"
        rm -rf "$month_dir"
        echo "✓ Removed successfully"
      fi
    else
      echo "Keeping: $month_dir (within retention period)"
    fi
  done
}

# Remove old events
echo ""
echo "--- Events ---"
remove_old_months "$EVENTS_DIR" "events"

# Remove old media
echo ""
echo "--- Media ---"
remove_old_months "$MEDIA_DIR" "media"

# Update manifest if not dry run
if [ "$DRY_RUN" = false ]; then
  echo ""
  echo "--- Updating Manifest ---"

  if command -v jq &> /dev/null; then
    # Get current oldest and newest dates from remaining data
    OLDEST_DATE=$(find "$EVENTS_DIR" -name "*.jsonl" -type f | sort | head -1 | xargs basename | sed 's/\.jsonl$//')
    NEWEST_DATE=$(find "$EVENTS_DIR" -name "*.jsonl" -type f | sort | tail -1 | xargs basename | sed 's/\.jsonl$//')

    if [ -n "$OLDEST_DATE" ] && [ -n "$NEWEST_DATE" ]; then
      # Update manifest using jq
      TMP_FILE=$(mktemp)
      jq --arg oldest "$OLDEST_DATE" \
         --arg newest "$NEWEST_DATE" \
         --arg cleanup "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
         '.data_range.oldest_date = $oldest |
          .data_range.newest_date = $newest |
          .last_cleanup = $cleanup |
          .last_updated = $cleanup' \
         "$MANIFEST_FILE" > "$TMP_FILE"

      mv "$TMP_FILE" "$MANIFEST_FILE"
      echo "✓ Manifest updated"
      echo "  Oldest date: $OLDEST_DATE"
      echo "  Newest date: $NEWEST_DATE"
    else
      echo "No data files found, manifest not updated"
    fi
  else
    echo "⚠ jq not installed, manifest not updated"
    echo "  Install jq to enable automatic manifest updates"
  fi
fi

echo ""
echo "=== Cleanup Complete ==="

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "This was a dry run. No files were actually deleted."
  echo "Run without --dry-run to perform actual cleanup."
fi
