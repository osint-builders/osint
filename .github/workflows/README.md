# GitHub Actions Workflows

See the top-level [README.md](../../README.md) for architecture and secrets setup.

## identify.yml — "Identify OSINT Tips" (Tip & Queue, stage 1)

- Trigger: `workflow_dispatch` only for now (schedule commented out until the pipeline is validated).
- Runs `builder/runtime/identify.sh` directly on the GitHub Actions runner — **no Warp agent, no LLM spend**. Cheap curl/jq/python3 scan across every processable source for the last hour; writes tip records to `data/queue/pending/` and commits with the ephemeral `github.token` (no `OSINT_GH_TOKEN` needed for this stage).

## qualify.yml — "Qualify OSINT Tips" (Tip & Queue, stage 2)

- Triggers: `workflow_dispatch`, plus `workflow_run` after identify.yml completes (schedule commented out until the pipeline is validated).
- Job `qualify` runs `builder/qualify.ts`, which partitions `data/queue/pending/*.json` into small batches (default 3 tips, `QUALIFY_BATCH_SIZE` override) and spawns one short-lived Warp Cloud Agent per batch to translate/extract/geocode/enrich each tip, then archives consumed tips to `data/queue/processed/`.
- Shares spawn/poll/cancel infrastructure with `collect` via `builder/lib/agent-runner.ts`, including the 10-minute per-run deadline and BLOCKED-state cancellation.
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

Drift detection on every PR + push to main. Four checks:

1. Prompt snapshot (`builder/prompts/collection-prompt.md` matches the pinned fixture)
2. `data/scripts/validate-events.js --all` (baseline schema validation)
3. `skills/README.md` regeneration stays clean
4. `builder/runtime/*.sh` and `.github/scripts/*.sh` pass `bash -n` (+ shellcheck when available)

## audit-bot-commits.yml — "Audit Bot Commits"

- Trigger: `workflow_run` after each collection/identify/qualify run + a daily sweep.
- Prompt-injection tripwire for agents holding a push-capable PAT. Asserts that commits reaching `main` **outside a pull request** touch only `data/events/**`, `data/indexes/**`, `data/queue/**`, `data/stats.json`, `LEARNINGS.md`; opens or comments on a **"Bot commit audit violation"** issue.
- Detection lives in `.github/scripts/audit-commits.sh`; run it locally with `AUDIT_REF=main AUDIT_SINCE='7 days ago' bash .github/scripts/audit-commits.sh`.
- Scope is `git log --first-parent --no-merges`, not an author-email allow-list. Reviewed work arrives on merged side branches and never appears there, while every pipeline push does — so an agent committing under an unexpected identity still gets audited. Maintainer emails are the only exclusion; the pipeline identity `admin@osint.builders` is deliberately in scope.
- `AUDIT_FLOOR_SHA` in the script pins the oldest auditable commit. Move it forward only deliberately.

## create-release.yml — "Create Weekly Data Release"

Weekly on Sunday at midnight UTC. Runs the 90-day retention sweep (`data/scripts/cleanup-old-data.sh`), then archives `data/events` + `data/indexes` to a release tarball.

## Troubleshooting

- Run failures → check the **Actions** tab and any open **"Collection workflow failing"** issue.
- Per-source telemetry stays inside each agent's ephemeral work directory; durable findings land in `LEARNINGS.md` and `source/manifest.json` notes.
- Stale `LEARNINGS.md` entries expire automatically via the orchestrator.
