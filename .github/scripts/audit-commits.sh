#!/usr/bin/env bash
# audit-commits.sh — tripwire for the pipeline's direct-push lane.
#
# Cloud agents process untrusted scraped content while holding a
# Contents:write PAT and push straight to main. Those commits carry [skip ci],
# so no push-triggered check sees them. This script is the only thing that
# notices when one writes outside data/**.
#
# This repo does not use pull requests — everything lands on main — so the
# discriminator is authorship, not branch structure: anything not authored by a
# maintainer is treated as automation and held to the data-path allow-list. The
# pipeline has exactly one identity (builder/runtime/git-identity.sh), so an
# agent that commits under any other identity is still caught by this default.
# --first-parent --no-merges keeps the walk on main's own line of history.
#
# Usage:  [AUDIT_REF=main] [AUDIT_SINCE='26 hours ago'] bash .github/scripts/audit-commits.sh
# Output: one TAB-separated line per violating commit: <sha> <author> <paths>
# Exit:   0 clean, 1 violations found.
set -euo pipefail

# Commits at or before this SHA are never audited. Pinned at rollout so
# pre-existing history cannot re-trip the audit. Move it forward only
# deliberately, after reviewing everything it would skip.
FLOOR_SHA="${AUDIT_FLOOR_SHA:-88105e901a3838a94516c7ae95d8068fcac61574}"

REF="${AUDIT_REF:-HEAD}"
SINCE="${AUDIT_SINCE:-26 hours ago}"

# Paths the direct-push lane may touch. Everything else trips the audit.
ALLOW_RE='^(data/events/|data/indexes/|data/queue/|data/stats\.json$|LEARNINGS\.md$)'

# Humans. Their direct pushes are a maintainer's own call, not a tripwire.
# Do NOT add admin@osint.builders here: that is the pipeline's own identity
# (builder/runtime/git-identity.sh), and auditing it is the entire point.
MAINTAINER_RE='^(erik@zettersten\.com|erik@veefriends\.com|.*@users\.noreply\.github\.com)$'

RANGE="$REF"
if git cat-file -e "${FLOOR_SHA}^{commit}" 2>/dev/null; then
  RANGE="${FLOOR_SHA}..${REF}"
fi

FOUND=0
while read -r sha author; do
  [ -n "$sha" ] || continue
  if echo "$author" | grep -qE "$MAINTAINER_RE"; then continue; fi
  bad=$(git diff-tree --no-commit-id --name-only -r "$sha" | grep -vE "$ALLOW_RE" || true)
  if [ -n "$bad" ]; then
    printf '%s\t%s\t%s\n' "$sha" "$author" "$(echo "$bad" | tr '\n' ' ' | sed 's/ $//')"
    FOUND=1
  fi
done < <(git log --first-parent --no-merges --since="$SINCE" --format='%H %ae' "$RANGE")

exit "$FOUND"
