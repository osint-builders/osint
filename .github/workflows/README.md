# GitHub Actions Workflows

See the top-level [README.md](../../README.md) for architecture and secrets setup.

## identify.yml — "Identify OSINT Tips" (Tip & Queue, stage 1)

- Triggers: daily at **09:00 America/New_York** (`cron: '0 9 * * *'` with an IANA `timezone:`, so DST is handled and it does not drift), plus `workflow_dispatch`.
- This is the only scheduled entry point for collection — `qualify.yml` chains off it via `workflow_run`. Do not add a schedule to `qualify.yml` too, or every tip gets processed twice.
- Runs `builder/runtime/identify.sh` directly on the GitHub Actions runner — **no Warp agent, no LLM spend**. Cheap curl/jq/python3 scan across every processable source for the last hour; writes tip records to `data/queue/pending/` and commits with the ephemeral `github.token` (no `OSINT_GH_TOKEN` needed for this stage).

## qualify.yml — "Qualify OSINT Tips" (Tip & Queue, stage 2)

- Triggers: `workflow_dispatch`, plus `workflow_run` after identify.yml completes. Intentionally has **no** `schedule:` of its own — the daily cadence lives on identify.yml and reaches this stage through the chain.
- Before dispatch, the job deletes pending tips older than 24 hours. Queue records are temporary handoff data, not retained archives.
- Job `qualify` runs `builder/qualify.ts`, which takes the newest pending tips in batches of 3 (`QUALIFY_BATCH_SIZE` override), capped at 10 agents per run (`QUALIFY_MAX_BATCHES` override). Each Warp Cloud Agent qualifies, translates, geocodes, attaches an image, and validates new events against `builder/prompts/qualified-event-contract.md`, then deletes consumed pending tips.
- Shares spawn/poll/cancel infrastructure with `collect` via `builder/lib/agent-runner.ts`, including the 10-minute per-run deadline and BLOCKED-state cancellation. Qualify, legacy collection, embeddings, and the data release share the `osint-data-writers` concurrency group so event and index writes serialize.
- Job `alert-on-failure` opens or updates a **"Qualify workflow failing"** issue on failure.

## collection.yml — "OSINT Snapshot Collection" (legacy, paused)

- Trigger: `workflow_dispatch` only — `schedule` and `push` triggers are commented out while the Tip & Queue pipeline (`identify.yml` + `qualify.yml`) is validated. Re-enable them (or retire this workflow) once you're confident in the replacement.
- Job `collect` runs `builder/index.ts`, which dispatches parallel Warp Cloud Agents — each processes a whole bucket of ~12 sources sequentially. This is the flow the Tip & Queue split replaces: smaller, bounded units of work instead of one long per-bucket run.
- Job `alert-on-failure` opens or updates a **"Collection workflow failing"** issue whenever `collect` fails.
- Downstream workflows chain off this workflow **by name**; rename them together.

## embeddings.yml — "Build Search Embeddings"

- Trigger: `workflow_run` after each "OSINT Snapshot Collection" or "Qualify OSINT Tips" completes (also `workflow_dispatch`).
- Runs `data/scripts/dedupe-events.js` (cross-bucket dedupe), rebuilds the semantic search index (`builder/embeddings/build_index.py`, local MiniLM), runs `data/scripts/rebuild-indexes.js`, and commits `data/events` + `data/indexes/` + `data/stats.json` with `[skip ci]`.

## deploy-pages.yml — "Deploy Pages"

- Builds the React frontend (`frontend/` → `docs/`, gitignored), copies `data/indexes/` → `docs/indexes/`, and deploys to GitHub Pages at `https://osint.builders/`.
- Triggers on `push` to main touching `frontend/**`, on `workflow_run` after embeddings.yml (any conclusion), or `workflow_dispatch`. Pages source must read **GitHub Actions** (not "Deploy from a branch").
- Workflow-level `concurrency: pages, cancel-in-progress: true` — a superseded deploy is safe to drop.

## release-cli.yml — "Release CLI"

- One job: packs `data/indexes/` into `cli/embed/*.gz`, cross-compiles the Go CLI for five platforms in a loop, verifies all five exist, and re-points the `cli-latest` release.
- Triggers on `push` to main touching `cli/**`, `workflow_dispatch`, or a **successful** embeddings `workflow_run`.
- Workflow-level `concurrency: release-cli, cancel-in-progress: false, queue: max` — releases serialize and queue instead of evicting each other.
- These two workflows were one file (`deploy-downstream.yml`) whose CLI jobs shared a **job-level** concurrency group. A group holds one running plus one pending entry, so each extra matrix leg evicted the pending one: three of five builds were cancelled seconds after queuing and the release job reported `skipped`. Keep concurrency at the workflow level here.

## verify.yml — "Verify"

Drift detection on pushes to main, with a protective PR trigger. Checks include:

1. Prompt snapshot (`builder/prompts/collection-prompt.md` matches the pinned fixture)
2. Builder TypeScript typecheck, agent lifecycle tests, and queue recovery
3. Recent committed-event baseline validation and new-event contract tests (pre-October 2026 records retain 16 malformed legacy IDs)
4. Source-index, image-enrichment, push-retry, retention, and release-consistency regressions
5. `skills/README.md` regeneration and shell syntax/lint checks

## audit-bot-commits.yml — "Audit Bot Commits"

- Trigger: `workflow_run` after each collection/identify/qualify run + a daily sweep.
- Prompt-injection tripwire for agents holding a push-capable PAT. Limits non-maintainer commits on `main` to `data/events/**`, `data/indexes/**`, `data/queue/**`, `data/stats.json`, and `LEARNINGS.md`; opens or comments on a **"Bot commit audit violation"** issue for other paths.
- Detection lives in `.github/scripts/audit-commits.sh`; run it locally with `AUDIT_REF=main AUDIT_SINCE='7 days ago' bash .github/scripts/audit-commits.sh`. Maintainer emails are excluded; the pipeline identity `admin@osint.builders` is audited.
- `AUDIT_FLOOR_SHA` in the script pins the oldest auditable commit. Move it forward only deliberately.

## create-release.yml — "Create Weekly Data Release"

Weekly on Sunday at midnight UTC. Applies the exact 90-day file cutoff (`data/scripts/cleanup-old-data.sh`), rebuilds and verifies semantic indexes and stats against the retained events, commits one consistent snapshot, then archives `data/events`, `data/indexes`, and `data/stats.json` to a release tarball. On a competing push, it rebuilds from the latest `main` before retrying. The release tag points to the verified snapshot commit.

## Troubleshooting

- Run failures → check the **Actions** tab and any open **"Qualify workflow failing"** or **"Collection workflow failing"** issue.
- Per-source telemetry stays inside each agent's ephemeral work directory; durable findings land in `LEARNINGS.md` and `source/manifest.json` notes.
- Stale `LEARNINGS.md` entries expire automatically via the orchestrator.
