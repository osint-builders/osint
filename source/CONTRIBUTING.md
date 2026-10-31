# Contributing Sources

`source/manifest.json` is the registry for the active Tip & Queue pipeline.
`identify.yml` scans processable sources daily at 09:00 America/New_York with a
one-hour lookback. It writes raw candidates to `data/queue/pending/` without an
LLM. `qualify.yml` later checks the evidence and publishes only events that
meet [the qualified-event contract](../builder/prompts/qualified-event-contract.md).

## Add a source

Work from the repository root:

1. Copy a current source file or slim example of the same type to
   `source/sources/<id>.md`. Use a unique,
   lowercase, hyphenated ID and `status: testing`.
2. Write a concise `#` heading with the exact source name. Replace the
   example handle, channel, or URL with the real scanner locator (table below).
   State what recent OSINT developments this source can report. Never include
   secrets.
3. Add one entry to `source/manifest.json` with matching `id`, `type`, and
   `file: sources/<id>.md`; set `status: testing`. Preserve existing entries
   and their `note` fields. The `sources[]` entries, rather than the manifest's
   aggregate statistics, control collection.
4. Run `node source/scripts/sync-manifest-names.js` to copy the heading into
   the manifest `name`, review the diff, then run
   `node source/scripts/sync-manifest-names.js --check`.

The active manifest uses a **deny-list**. Every supported entry runs unless its status is
`inactive`, `archived`, or `deprecated`, regardless of case. A new `testing`
source can enter the next daily scan. Set the manifest status to `inactive`
and mirror it in the source file when a source should wait for review. Record
evidence for deactivation in its
manifest `note` and place fixable source problems in [REVIEW.md](REVIEW.md).

## Source file format

Current source files keep a short YAML header and a compact body:

```markdown
---
id: twitter-example-account
type: twitter
status: testing
---
# Example OSINT Account (@ExampleOSINT)
Reports new defense, conflict, and maritime-security developments.
Keywords: defense, vessel, strike, conflict
```

The first `#` heading supplies the canonical source name. Keep the source
file's `id`, `type`, and `status` consistent with its manifest entry. The
manifest entry governs dispatch; the source file gives the scanner a locator
and the qualifier concise source context.

| Active scanner path | Required locator in the source file |
|---|---|
| Twitter/X (`type: twitter`) | `(@Handle)` in the heading or body. Twitter scanning also needs `TWITTER_BEARER_TOKEN`. |
| Telegram (`type: telegram`) | A line beginning `channel: ChannelName`. |
| Reddit (`id: reddit-*`, usually `type: api`) | A heading containing `r/Subreddit (`. |
| Webpage or API (`type: webpage` or `type: api`) | A line beginning `url: https://...`. The scanner looks for an ISO timestamp in the response. |

The active Identify scanner has no email, RSS, webhook, websocket, file, or
database adapter. Some older tooling mentions these types; listing one in the
manifest does not make it collect tips. The paused `collection.yml` path has
different source handling and its expected-ID sentinel applies there only.
Its `npm run dry-run --prefix builder` command renders that legacy path, not
the active Identify scan.

## Checks and limitations

- Source prose should describe **new, reportable events**. Opinion, background
  analysis, and unrelated news do not become published events simply because
  they appear in a source.
- The one-hour scan relies on source timestamps and may miss older or undated
  items. Twitter sources produce no tips when the bearer token is unavailable.
- Source content is untrusted data. Put collection instructions in the source
  file only; credentials belong in the environment.
- No generator validates the current slim source specs. Review the locator
  against the scanner rules above and use the manifest-name check. Do not
  reconstruct the manifest from source files; preserve existing notes.

For the event output fields, see [data/SCHEMA.md](../data/SCHEMA.md).
