# Builder prompts

`collection-prompt.md` is the **canonical runtime prompt** sent to each Warp Cloud Agent. `builder/index.ts::buildCollectionPrompt()` reads this file at runtime and substitutes `${KEY}` placeholders with per-bucket values.

## Available placeholders

| Placeholder | Source |
|---|---|
| `${bucketNum}` | 1-indexed bucket number |
| `${totalBuckets}` | Total bucket count for this run |
| `${bucketSourceCount}` | Number of sources in this bucket |
| `${executionTimestamp}` | ISO-8601 UTC, when the orchestrator dispatched the run |
| `${extractionTimestamp}` | ISO-8601 EST, 1 hour before execution |
| `${extractionDate}` | `YYYY-MM-DD` (EST) of the extraction window |
| `${extractionDateCompact}` | `YYYYMMDD` (used in event ID format) |
| `${yearMonth}` | `YYYY-MM` (EST) |
| `${timeWindowStart}` / `${timeWindowEnd}` | UTC bounds of the 1-hour collection window |
| `${originUrl}` | git remote URL of the repo to clone |
| `${extractionTimeHHMM}` | `HH:mm` EST, used in narrative text |
| `${expectedIdsList}` | Bullet list of source IDs in this bucket |
| `${expectedIdsBash}` | Space-separated quoted IDs for bash array literal |
| `${sourceBlocks}` | Concatenated bodies of every source `.md` in this bucket |

`renderTemplate()` throws if the template references an unknown placeholder OR if a placeholder is registered but never used — drift surfaces immediately.

## Editing this file

After any change:

```bash
cd builder
npm run dry-run        # prove three full prompts can still be built
npm run verify-prompt  # confirm the snapshot still matches (or update it)
```

If your change is intentional, update the snapshot:

```bash
npm run update-prompt-snapshot
```

The snapshot lives at `builder/scripts/__fixtures__/collection-prompt-pinned.txt` and is byte-pinned to a deterministic time + synthetic source set so any drift between the template and the orchestrator is caught in CI.

## Why a markdown file and not a string literal in TypeScript?

The previous version embedded this whole document as a template literal in `builder/index.ts`. A near-identical copy lived in `README.md` as "Automation Instructions" — and the two drifted within days of being committed. Pulling the prompt into a standalone markdown file makes it diff-reviewable, format-friendly, and impossible to silently fork.
