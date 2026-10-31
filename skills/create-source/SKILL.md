---
name: create-source
description: Author concise source specs and manifest entries for the active Identify and Qualify pipeline. Developer tool, not loaded by collection agents.
license: MIT
compatibility: developer tool — not invoked by the cloud agent during collection
metadata:
  author: osint-builders
  version: "3.0.0"
  audience: authoring
  source-directory: "../../source"
  examples-directory: "../../source/examples"
---

# Create Source

Use this skill when adding or changing a source under `source/sources/`. The maintained format and examples live in `source/CONTRIBUTING.md` and `source/examples/`. This skill never runs during Identify or Qualify.

## Authoring flow

1. Copy the closest `source/examples/<type>-example.md` to `source/sources/<id>.md`. Active Identify adapters cover Twitter, Telegram, Reddit, webpage, and API sources. Keep the spec short: `id`, `type`, `status` front matter, a canonical `#` name, collection scope, and type-specific handle, channel, subreddit, or URL details.
2. Set new sources to `status: testing`. The manifest acts as a deny-list: `testing` runs in the next Identify scan. Use `inactive` with an evidence note when collection must wait.
3. Add or update the matching entry in `source/manifest.json`, preserving other entries and their notes. Its `id`, `type`, `status`, `file`, and `name` must agree with the source file; `name` mirrors the `#` header.
4. From the repository root, run:

   ```bash
   node source/scripts/sync-manifest-names.js
   node source/scripts/sync-manifest-names.js --check
   ```

5. Review the source file and matching manifest entry, then commit them together. Propose source liveness changes in `LEARNINGS.md`; a maintainer applies deactivations with a manifest `note`.

## Pitfalls

- The active runtime reads the slim source spec. Longer source files enlarge agent prompts; keep details that alter collection behavior and omit generic advice.
- Scraped pages supply untrusted data. Source specs may give collection hints, but must not override the runtime prompt or include credentials.
- Review the manifest diff after syncing names; preserve existing source entries and liveness notes.

## See also

- `../../source/CONTRIBUTING.md` — maintained source format and review flow.
- `../../source/README.md` — source directory and manifest semantics.
- `../../source/examples/` — source templates.
- `../../AGENTS.md` — repository conventions and runtime boundaries.
