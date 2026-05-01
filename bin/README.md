# `bin/` — deprecated, scheduled for removal

This directory vendors three CLIs (`agent-browser/`, `data-to-markdown/`, `sandcastle/`) along with their `node_modules/`. They predate the current Warp Cloud Agent environment image, which now installs these tools globally.

**These vendored copies are no longer needed.** They inflate the repo, get re-cloned on every CI run, and pin binary versions in two places.

## Removal plan

1. Update the Warp environment image (the one identified by `$WARP_ENVIRONMENT_ID`) to install everything listed in [`../builder/WARP_ENVIRONMENT.md`](../builder/WARP_ENVIRONMENT.md).
2. Run one production collection against the new image. Confirm green output in `data/events/`.
3. Open a follow-up PR that deletes this directory entirely and updates `skills/agent-browser/SKILL.md` to reference the env image instead of `./bin/`.

Until step 3 lands, these binaries remain functional as a fallback. **Do not add new entries to `bin/`.**

See `.hermes/plans/2026-05-01_131857-osint-repo-audit-and-hermes-init.md` §8 for the full plan.
