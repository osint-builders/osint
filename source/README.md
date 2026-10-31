# Sources

`manifest.json` decides which supported sources run. `identify.yml` reads the manifest and
parses each selected `sources/<id>.md` file for a handle, channel, or URL.
`qualify.yml` passes the same source file to a cloud agent as context for
qualifying the resulting tip.

## Files

- `manifest.json` — authoritative source registry and liveness notes.
- `sources/<id>.md` — short source specification. Its first `#` heading supplies
  the canonical `source.name` and must match the manifest `name`.
- `REVIEW.md` — source problems that require maintainer review.
- `examples/` — slim templates for the active Twitter, Telegram, Reddit,
  RSS, webpage, and API scanner paths.
- `scripts/sync-manifest-names.js` — copies source headings to manifest names;
  `--check` reports drift without editing.

## Add a source

From the repository root:

1. Copy a current file under `sources/` or a slim file under `examples/` that
   matches the source type. Keep its
   frontmatter and body short, with a unique `id`, `type`, `status: testing`, and
   a descriptive `#` heading.
2. Add a **single** entry to `manifest.json` with matching `id`, `type`, and
   `file: sources/<id>.md`. Set `status: testing`. Preserve all existing entries
   and notes.
3. Run `node source/scripts/sync-manifest-names.js` and review the manifest
   diff. Then run `node source/scripts/sync-manifest-names.js --check`.

The manifest uses a deny-list: each supported source runs unless its status is
`inactive`, `archived`, or `deprecated`. A new `testing` source can enter the next daily scan. Set its
manifest and source-file status to `inactive` when it must wait for review.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the supported scanner types and
format. New published events follow [the event schema](../data/SCHEMA.md).
