# GitHub Actions Workflows

See [README.md](../../README.md) (top-level) for architecture and secrets setup.

## hourly-collection.yml

- Cron: every `:00` UTC
- Triggers: `schedule` | `workflow_dispatch` | `push` (with `paths-ignore`)
- One job: `collect` — runs `builder/index.ts` (the orchestrator that dispatches Warp Cloud Agents).
- See [../../README.md](../../README.md) "Configuration" for required secrets.

## embeddings.yml

- Trigger: `workflow_run` after every successful `Hourly OSINT Collection` (also `workflow_dispatch`).
- Rebuilds the semantic search index from collected events and commits artifacts to `docs/search-index/`.
- Decoupled from `hourly-collection.yml` so the two cadences can evolve independently.

## verify.yml

Drift-detection on every PR + push to main. Three checks:

1. Prompt snapshot (`builder/prompts/` is up-to-date)
2. `data/scripts/validate-events.js --all` (baseline schema validation)
3. `skills/README.md` regeneration is clean

## pages.yml

Builds the React search frontend and deploys `docs/` to GitHub Pages.

- Triggers on `push` to main touching `frontend/**` or `docs/search-index/**`,
  on `workflow_run` after `embeddings.yml` succeeds, or `workflow_dispatch`.
- Pages source must be set to **GitHub Actions** (not "Deploy from a branch").
- See [`../../docs/README.md`](../../docs/README.md) for the deployment flow.

## create-release.yml

Weekly on Sunday at midnight UTC. Runs the 90-day retention sweep, then archives `data/` to a release tarball.

## Troubleshooting

- Per-run telemetry lives in `data/run-logs/`.
- Stale `LEARNINGS.md` entries expire automatically.
- For workflow failures, inspect the **Actions** tab on GitHub.
