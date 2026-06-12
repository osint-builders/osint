# Builder prompts

`collection-prompt.md` serves as the **canonical runtime prompt** sent to each Warp Cloud Agent. `builder/index.ts::buildCollectionPrompt()` reads this file at runtime and substitutes `${KEY}` placeholders with per-bucket values.

The prompt stays deliberately thin: judgment-heavy instructions (what to collect, how to extract entities) live here; mechanical steps live in `builder/runtime/*.sh`, which the agent invokes after cloning the repo. Keep that boundary — bash pasted into this template escapes linting and testing.

## Available placeholders

| Placeholder | Source |
|---|---|
| `${bucketNum}` | 1-indexed bucket number |
| `${totalBuckets}` | Total bucket count for this run |
| `${bucketSourceCount}` | Number of sources in this bucket |
| `${executionTimestamp}` | ISO-8601 UTC, when the orchestrator dispatched the run |
| `${extractionTimestamp}` | ISO-8601 America/New_York, 1 hour before execution |
| `${extractionDate}` | `YYYY-MM-DD` (America/New_York) — names the day file |
| `${yearMonth}` | `YYYY-MM` (America/New_York) |
| `${timeWindowStart}` / `${timeWindowEnd}` | UTC bounds of the 1-hour collection window |
| `${originUrl}` | git remote URL of the repo to clone |
| `${extractionTimeHHMM}` | `HH:mm` America/New_York, used in narrative text |
| `${expectedIdsList}` | Bullet list of source IDs in this bucket |
| `${expectedIdsBash}` | Space-separated quoted IDs for script arguments |
| `${sourceBlocks}` | Concatenated bodies of every source `.md` in this bucket |
| `${learnings}` | Pruned `LEARNINGS.md` entries (≤10 KB) |

`renderTemplate()` throws if the template references an unknown placeholder OR if a placeholder gets registered but never used — drift surfaces immediately.

## Editing this file

After any change:

```bash
cd builder
npm run dry-run        # prove full prompts still build
npm run verify-prompt  # confirm the snapshot still matches (or update it)
```

For an intentional change, update the snapshot:

```bash
npm run update-prompt-snapshot
```

The snapshot lives at `builder/scripts/__fixtures__/collection-prompt-pinned.txt`, byte-pinned to a deterministic time + synthetic source set, so any drift between the template and the orchestrator gets caught in CI.

## Why a markdown file and not a string literal in TypeScript?

An earlier version embedded this whole document as a template literal in `builder/index.ts`. A near-identical copy lived in `README.md` as "Automation Instructions" — and the two drifted within days of landing. Pulling the prompt into a standalone markdown file makes it diff-reviewable, format-friendly, and impossible to silently fork.
