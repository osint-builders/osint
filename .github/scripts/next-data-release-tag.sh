#!/usr/bin/env bash
set -euo pipefail

release_date="${1:?usage: next-data-release-tag.sh YYYY-MM-DD}"
if [[ ! "$release_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "Expected a UTC date in YYYY-MM-DD format." >&2
  exit 2
fi

base="data-$release_date"
remote_tags="$(git ls-remote --tags --refs origin "refs/tags/$base" "refs/tags/$base-r*")"
next_revision=0
while read -r _ ref; do
  tag="${ref#refs/tags/}"
  if [[ "$tag" == "$base" ]]; then
    if (( next_revision < 2 )); then next_revision=2; fi
  elif [[ "$tag" =~ ^${base}-r([1-9][0-9]*)$ ]]; then
    revision="${BASH_REMATCH[1]}"
    if (( revision >= next_revision )); then next_revision=$((revision + 1)); fi
  fi
done <<< "$remote_tags"

if (( next_revision == 0 )); then
  printf '%s\n' "$base"
else
  printf '%s-r%s\n' "$base" "$next_revision"
fi
