#!/bin/bash

# export-date-range.sh
# Export events and media for specified date range

set -euo pipefail

echo "=== Data Export ==="
echo "This script exports events and media for a date range"
echo ""
echo "Usage: ./export-date-range.sh [start] [end] [--with-media]"
echo ""
echo "Examples:"
echo "  ./export-date-range.sh 2026-04-29"
echo "  ./export-date-range.sh 2026-04-01 2026-04-29"
echo "  ./export-date-range.sh 2026-04-15 2026-04-20 --with-media"
echo ""
echo "⚠ Not yet implemented"
echo ""
echo "TODO: Implement export logic"
echo "  1. Parse date range arguments"
echo "  2. Copy JSONL files for date range"
echo "  3. Optionally copy media files"
echo "  4. Create ZIP archive"
echo "  5. Output to exports/ folder"

exit 0
