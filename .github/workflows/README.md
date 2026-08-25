# GitHub Actions Workflows

See the top-level [README.md](../../README.md) for architecture and secrets setup.

## collection.yml — "OSINT Snapshot Collection"

- Cron: `0 9,13,17 * * *` in `America/New_York` — three 1-hour snapshot windows per day.
- Triggers: `schedule` | `workflow_dispatch` | `push` to main touching `source/**`, `builder/index.ts`, `builder/prompts/collection-prompt.md`, or `builder/runtime/**` (explicit allow-list).
- Job `collect` runs `builder/index.ts`, which dispatches parallel Warp Cloud Agents.
- Job `alert-on-failure` opens or updates a **"Collection workflow failing"** issue whenever `collect` fails — credit exhaustion can no longer kill the pipeline silently.
- Downstream workflows chain off this workflow **by name**; rename them together.

## embeddings.yml — "Build Search Embeddings"

- Trigger: `workflow_run` after each "OSINT Snapshot Collection" completes (also `workflow_dispatch`).
- Runs `data/scripts/dedupe-events.js` (cross-bucket dedupe), rebuilds the semantic search index (`builder/embeddings/build_index.py`, local MiniLM), runs `data/scripts/rebuild-indexes.js`, and commits `data/events` + `data/indexes/` + `data/stats.json` with `[skip ci]`.

## deploy-downstream.yml — "Deploy Downstream Artifacts"

Two independent job groups sharing one workflow, each with its own `concurrency` group:

- **Pages** (`pages-build` → `pages-deploy`): builds the React frontend (`frontend/` → `docs/`, gitignored), copies `data/indexes/` → `docs/indexes/`, and deploys to GitHub Pages at `https://osint.builders/`. Triggers on `push` to main touching `frontend/**` or `data/indexes/**`, on `workflow_run` after embeddings.yml (any conclusion), or `workflow_dispatch`. Pages source must read **GitHub Actions** (not "Deploy from a branch").
- **CLI** (`cli-prepare` → `cli-build` → `cli-release`): packs `data/indexes/` into `cli/embed/*.gz`, cross-compiles the Go CLI for five platforms, and re-points the `cli-latest` release. Only runs on `workflow_dispatch` or when the embeddings `workflow_run` succeeded.

## verify.yml — "Verify"

Drift detection on every PR + push to main. Four checks:

1. Prompt snapshot (`builder/prompts/collection-prompt.md` matches the pinned fixture)
2. `data/scripts/validate-events.js --all` (baseline schema validation)
3. `skills/README.md` regeneration stays clean
4. `builder/runtime/*.sh` pass `bash -n` (+ shellcheck when available)

## audit-bot-commits.yml — "Audit Bot Commits"

- Trigger: `workflow_run` after each collection run + a daily sweep.
- Asserts bot-authored commits touch only `data/events/**`, `data/indexes/**`, `data/stats.json`, `LEARNINGS.md`; opens an issue on violation (prompt-injection tripwire for agents holding a push-capable PAT).

## create-release.yml — "Create Weekly Data Release"

Weekly on Sunday at midnight UTC. Runs the 90-day retention sweep (`data/scripts/cleanup-old-data.sh`), then archives `data/events` + `data/indexes` to a release tarball.

## Troubleshooting

- Run failures → check the **Actions** tab and any open **"Collection workflow failing"** issue.
- Per-source telemetry stays inside each agent's ephemeral work directory; durable findings land in `LEARNINGS.md` and `source/manifest.json` notes.
- Stale `LEARNINGS.md` entries expire automatically via the orchestrator.
