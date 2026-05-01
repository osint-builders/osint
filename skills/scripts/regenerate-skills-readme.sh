#!/usr/bin/env bash
# Regenerates skills/README.md from each skill's frontmatter.
# Run from the repo root: ./skills/scripts/regenerate-skills-readme.sh
#
# CI runs this and fails if the output drifts from what's committed:
#   git diff --exit-code skills/README.md
set -euo pipefail

cd "$(dirname "$0")/../.."  # repo root

OUT=skills/README.md
TMP=$(mktemp)

cat > "$TMP" <<'HEADER'
# Skills

Procedural references for the cloud agent. Each skill lives at `skills/<name>/SKILL.md` with optional `references/` deep-dive files. The agent loads `SKILL.md` on demand from the runtime prompt.

> This file is auto-generated. Do not edit by hand. Run `./skills/scripts/regenerate-skills-readme.sh` after editing any skill's frontmatter.

## Skill index

| Name | Description | Lines |
|---|---|---|
HEADER

for skill_md in skills/*/SKILL.md; do
  name=$(awk '/^name:/ { print $2; exit }' "$skill_md")
  desc=$(awk '
    /^description:/ {
      sub(/^description: */, "")
      # Trim leading/trailing quotes if present
      gsub(/^["'\'']|["'\'']$/, "")
      # Truncate to ~120 chars for table readability
      if (length($0) > 120) print substr($0, 1, 117) "..."
      else print
      exit
    }
  ' "$skill_md")
  audience=$(awk '/^[[:space:]]*audience:/ { print $2; exit }' "$skill_md")
  lines=$(wc -l < "$skill_md" | tr -d ' ')
  marker=""
  if [ "$audience" = "authoring" ]; then
    marker=" 🛠"  # authoring-only, skipped at runtime
  fi
  printf "| [\`%s\`](%s/SKILL.md)%s | %s | %s |\n" \
    "$name" "$(dirname "$skill_md" | sed 's|^skills/||')" "$marker" "$desc" "$lines" >> "$TMP"
done

cat >> "$TMP" <<'FOOTER'

🛠 = authoring-only skill, not loaded by the cloud agent during collection runs.

## Adding a new skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`, `license`, `metadata.author`, `metadata.version`, `compatibility`).
2. Keep `SKILL.md` ≤ ~150 lines: Overview / When to use / Entry-point commands / Pitfalls / See also. Push deep content into `references/`.
3. If the skill needs a CLI tool that isn't already in the Warp env image, update [`builder/WARP_ENVIRONMENT.md`](../builder/WARP_ENVIRONMENT.md) in the same PR and tag the env-image owner.
4. Run `./skills/scripts/regenerate-skills-readme.sh` and commit the regenerated `README.md`.
FOOTER

mv "$TMP" "$OUT"
echo "Regenerated $OUT"
