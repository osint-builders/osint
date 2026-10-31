# Runtime prompts

`qualify-prompt.md` drives the active Tip & Queue qualification stage. `collection-prompt.md` drives the paused, manually dispatched legacy collector. Both agents read `qualified-event-contract.md` after cloning the repository and validate new events with `data/scripts/validate-events.js --qualified` before publishing.

Keep source judgment and the typed output contract in these Markdown files. Put repeatable file, network, geocoding, enrichment, and git operations in `builder/runtime/` so they can be checked independently. Scraped content remains data, never instructions.

The TypeScript builders in `builder/lib/qualify-batches.ts` and `builder/lib/collection-prompt.ts` supply run values to the templates. `builder/lib/prompt-template.ts` rejects missing and unused `${KEY}` placeholders. Every complete prompt gets checked against the 1 MB limit before an agent starts.

## Checks after an edit

From `builder/`:

```bash
npm run qualify-dry-run
npm run dry-run
npm run verify-prompt
```

The legacy collection prompt has a committed, deterministic snapshot at `scripts/__fixtures__/collection-prompt-pinned.txt`. After reviewing an intentional template change, refresh it with `npm run update-prompt-snapshot`, then rerun `npm run verify-prompt`. The active qualifier has focused planning tests in `lib/qualify-batches.test.ts` and published-event contract tests in `data/scripts/tests/qualified-event.test.js`.
