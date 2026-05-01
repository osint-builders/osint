# OSINT Repo — Macro Review (post PR-1..PR-6)

**Author:** Hermes (plan mode, read-only)
**Date:** 2026-05-01
**Project goal in one line:** *A GitHub Actions cron orchestrates AI agents to collect, structure, and archive OSINT world events on an hourly cadence.*

This review reads the repo end-to-end against that goal and flags everything that gets in the way: redundancy, drift, structural cruft, real bugs, and silent inconsistencies. PRs 1–6 fixed the biggest stuff (prompt drift, README bloat, memory.md noise, oversized skills, vendored bin/). What remains is a long tail.

Items are ranked **🔴 must-fix** / **🟡 should-fix** / **🟢 nice-to-have**.

---

## 1. Real bugs and drift (🔴)

### 1.1 `validate-events.js` is silently out of sync with the runtime
**File:** `data/scripts/validate-events.js`
**Symptom:** the validator passes events that the runtime would reject.

| Rule | Runtime prompt enforces? | `validate-events.js` enforces? |
|---|---|---|
| Required: `id, source, title, summary, contents, date_published, links, image_urls` | ✅ | ✅ |
| Required: `geo` with `geo.lat` and `geo.lon` | ✅ Step 4 | ❌ — `geo` only checked *if present* |
| `geo.lat ∈ [-90, 90]` and `geo.lon ∈ [-180, 180]` | ✅ Step 4 | ✅ |
| E-PRIME enforcement on `contents` | ✅ Step 4 (fails on match) | ❌ — not checked at all |
| `date_published` within the run's 1-hour window | ✅ Step 4 | ❌ — only checks ISO format |

This is one of the most damaging kinds of drift: the local/CI validator reports green for data the prompt would have rejected, so a regression in the prompt or in an agent run wouldn't get caught by `node data/scripts/validate-events.js --from $(date +%Y-%m-%d)`.

**Fix:** make `validate-events.js` the single source of validation truth, and have the prompt's Step 4 *call* it instead of inlining its own bash. Add:
- `geo`, `geo.lat`, `geo.lon` to `SCHEMA.required`.
- A simple regex E-PRIME check on `contents` (the same set: `is|are|was|were|be|been|being`).
- Optional `--time-window START END` flag for the runtime to invoke.

`data/SCHEMA.md` also lists `geo` as **optional**. Pick one position — given the runtime makes it required, promote it in SCHEMA.md too.

### 1.2 `memory.md` paths-ignore is now stale
**File:** `.github/workflows/hourly-collection.yml` line 17
```yaml
paths-ignore:
  - 'data/**'
  - 'memory.md'       # ← file no longer exists; should be LEARNINGS.md
  - '**/*.md'
```
The third entry (`**/*.md`) already covers `LEARNINGS.md`, so the bug is cosmetic — but it's a tell that nobody updated the workflow when memory.md was renamed.

**Fix:** remove the `memory.md` line; `**/*.md` covers it. While there: confirm `data/run-logs/**` isn't going to spam-trigger pushes to main (it shouldn't because it lives under `data/**`, but worth verifying).

### 1.3 `build-embeddings` job runs on every push — including its own commits
**File:** `.github/workflows/hourly-collection.yml` lines 62-100
The `build-embeddings` job has no `paths-ignore`, no `[skip ci]` guard, and commits its own output back to the repo. Plus `hourly-collection.yml` itself triggers on `push: main` (with paths-ignore). Combined with the embeddings job pushing index files, this can create:
- Push of `data/events/...` from the cloud agent → triggers nothing (ignored by paths-ignore on `collect`, embeddings only runs `needs: collect`).
- Embeddings job pushes `docs/search-index/...` → not ignored. Workflow re-runs.
- Re-run no-ops because no new events, but every hour you pay one extra workflow invocation.

**Fix:** add `[skip ci]` to the embeddings commit message (the collect job already does this in the cloud agent prompt at Step 8) **or** add `docs/search-index/**` to `paths-ignore`.

### 1.4 90-day retention is claimed but never executed
**Files:** `data/scripts/cleanup-old-data.sh`, both workflow YAMLs.
`data/manifest.json` declares `"retention_days": 90` and `"last_cleanup": null, "next_cleanup": null`. `cleanup-old-data.sh` exists, is executable, and is **not invoked by any workflow**. After 90+ days of running, `data/events/` and `data/media/` will grow without bound.

**Fix options:**
1. Add a `cleanup` job to `create-release.yml` (runs weekly anyway) that calls `data/scripts/cleanup-old-data.sh` and updates `last_cleanup`/`next_cleanup` in `data/manifest.json`.
2. Or: drop the retention claim from `data/manifest.json` and `README.md`'s old language. Don't promise what isn't enforced.

### 1.5 `data/manifest.json` `events_by_source` and `media_files` are empty
**File:** `data/manifest.json`
```json
"statistics": {
  "total_events": 420,
  "events_by_month": { "2026-04": 418, ... },
  "events_by_source": {},        // ← always empty
  "media_files": {}              // ← always empty
}
```
Looking at the prompt's Step 8.5, the cloud agent uses `data/scripts/stats-report.js` to populate these via `jq`. Either the script returns empty objects for these keys or the `jq` patch path is wrong. **Either fix the script, fix the patch, or remove the fields.** Empty stats keys are worse than no stats keys — they imply "we tracked it and it was zero."

### 1.6 Sentinel cross-check is racy
**File:** `builder/index.ts` partitions sources, builds prompts, then dispatches buckets. Each bucket's prompt embeds *its bucket's* expected IDs. The cross-check inside the agent compares **its bucket's IDs** against the **full live manifest**. That's a guaranteed mismatch on every multi-bucket run because no single bucket equals the whole manifest.

Look at the actual bash in `collection-prompt.md` (Step 0.5):
```bash
EXPECTED_SORTED=$(printf "%s\n" "${EXPECTED_IDS[@]}" | sort)
if [ "$EXPECTED_SORTED" != "$MANIFEST_IDS" ]; then
  echo "ERROR: Source list mismatch ..."
  exit 1
fi
```
With 3 buckets of 49/49/48 sources, every bucket aborts on this check.

But the runs aren't actually aborting — they're producing data. So the check is **silently never hit**, which means either bash is comparing differently than I think, or `MANIFEST_IDS` is being filtered by something else, or the check runs but the `exit 1` doesn't propagate.

**Recommended action:** verify in a dry-run by extracting the bash from one of `.dry-run-prompts/bucket-1.md` and running it. Either:
- The check is actually broken (false negative) — fix it to compare *bucket subset* ⊂ *manifest set* and abort if any expected ID is missing from the manifest.
- The check accidentally works because both `EXPECTED_SORTED` and `MANIFEST_IDS` end up as the full sorted list when sourced from `source/manifest.json` from inside the cloned repo — which would mean the bucket-specific scoping in `builder/index.ts` is never actually verified at runtime.

Either way, the current logic doesn't do what the comment claims.

### 1.7 `git push` token guard is brittle
**File:** `builder/prompts/collection-prompt.md` Step 8 (lines 415-435 of the rendered prompt).

```bash
PUSH_TOKEN="${OSINT_GH_TOKEN}"  # falls back to GH_TOKEN, but...
if [ -z "$PUSH_TOKEN" ]; then
  echo "ERROR: No push token available (set OSINT_GH_TOKEN or GH_TOKEN)." >&2
  exit 1
fi
```
The guard only reads `OSINT_GH_TOKEN`, not `GH_TOKEN`. The "falls back to" claim in the comment is false. If only `GH_TOKEN` is set, this hard-fails.

**Fix:**
```bash
PUSH_TOKEN="${OSINT_GH_TOKEN:-$GH_TOKEN}"
```

### 1.8 `paths-ignore: '**/*.md'` swallows real source changes
**File:** `.github/workflows/hourly-collection.yml` line 18.

This rule prevents the workflow from running on any markdown change. Good for excluding README edits from triggering hourly runs — but **`source/sources/*.md` are the source-of-truth specs**. Editing one (renaming a Twitter handle, fixing a selector) won't trigger a verification run. Combined with the cron-only safety net, you only find out that an edit broke a source after the next 00:00 cron fires.

**Fix:** keep `**/*.md` in `paths-ignore`, but **remove the path-trigger on push entirely** — push triggers should be opt-in via `workflow_dispatch`. The cron is the contract.

Or keep push trigger but narrow `paths-ignore` to documentation-only paths:
```yaml
paths-ignore:
  - 'README.md'
  - 'AGENTS.md'
  - 'LEARNINGS.md'
  - 'docs/**'
  - '*/README.md'
  - '**/CONTRIBUTING.md'
```

---

## 2. Verbosity and redundancy (🟡)

### 2.1 `.github/workflows/README.md` is 366 lines for two workflows
The hourly-collection.yml file is 100 lines and self-explanatory. The README around it is 366 lines. It re-documents:
- Things visible in the YAML.
- Secret setup steps (already in main `README.md` after PR-1).
- An ASCII architecture diagram (already in main README).
- A troubleshooting section that overlaps `data/run-logs/`.

**Fix:** slim to ~50 lines: one paragraph each per workflow + secrets table + a "see ../../README.md for architecture." Net delete: ~310 lines.

### 2.2 `data/README.md` is 451 lines describing what `data/SCHEMA.md` already describes
Most of `data/README.md` is a second copy of the schema in `data/SCHEMA.md` (346 lines). The only unique content is the storage layout (`data/events/YYYY-MM/...`) and a link to validation scripts.

**Fix:** slim to ~80 lines: layout + scripts + retention policy + link to `SCHEMA.md`. Net delete: ~370 lines.

### 2.3 `source/README.md` (259) + `source/CONTRIBUTING.md` (439) overlap heavily
Both files explain "how to add a source" with different levels of detail. CONTRIBUTING is the more authoritative one. README duplicates ~60% of CONTRIBUTING.

**Fix:** make `source/README.md` ~30 lines: "this directory holds OSINT source specs; see CONTRIBUTING.md to add one; see SCHEMA in source/manifest.json schema below." Or just merge the two into one `source/CONTRIBUTING.md`.

### 2.4 `data/examples/` is 160 lines describing one JSONL file
**File:** `data/examples/2026-04/2026-04-29.jsonl` + `data/examples/README.md` (160 lines).

The README explains the schema again. The schema lives in `data/SCHEMA.md`. The example itself is fine; the README is duplicate.

**Fix:** `data/examples/README.md` becomes 5 lines: "Example events. See `../SCHEMA.md` for schema." Net delete: ~155 lines.

### 2.5 `skills/create-source/scripts/README.md` is 479 lines for 4 small CLIs
The script directory has a 479-line manual for `create-source.js`, `validate-source.js`, `test-source.js`, `update-manifest.py`. These CLIs each have `--help`. The skill's `references/QUICK-REFERENCE.md` covers the same ground.

**Fix:** delete `skills/create-source/scripts/README.md`; rely on `--help` and `references/QUICK-REFERENCE.md`. Net delete: 479 lines.

### 2.6 `builder/embeddings/README.md` (135 lines) duplicates code comments
The build_index.py docstring at the top of the file says the same thing as the README's "## Overview" section. The README also re-documents OpenAI cost estimates, which belong in code comments next to the cost-affecting calls.

**Fix:** slim to ~30 lines (purpose + run command + outputs). Move cost notes to `embedder.py` comments where they're enforced.

---

## 3. Structural inconsistencies (🟡)

### 3.1 Three places call themselves "the source of truth"
- `builder/prompts/collection-prompt.md` says it is canonical for the runtime prompt. ✅ true.
- `data/SCHEMA.md` says it is canonical for entity schema. ✅ true (after PR-5).
- `data/manifest.json` repeats schema metadata under `metadata.compatible_versions` and `schema_version`. ❌ duplicates SCHEMA.md.

**Fix:** strip `metadata.*` and `schema_version` from `data/manifest.json`. The file should track *runtime statistics only* (what was collected, when, retention state). Schema versioning lives in `data/SCHEMA.md`.

### 3.2 Two manifests, two purposes, same name
- `source/manifest.json` — source registry (input).
- `data/manifest.json` — collection statistics (output).

That's confusing. They have different schemas, different update cadences, different audiences.

**Fix (low-cost):** rename `data/manifest.json` → `data/stats.json`. Update references in `builder/index.ts`'s prompt template, `data/scripts/stats-report.js`, and `data/README.md`. Done.

### 3.3 `last_updated` field on `source/manifest.json` is hand-maintained but stale
The file is 1503 lines, regenerated implicitly every time `source/sources/*.md` changes. The top-level `last_updated` field requires humans to remember to bump it. Currently shows a date weeks behind reality.

**Fix:** drop the field. Git already tracks last-modified.

### 3.4 `frontend/`, `docs/`, `builder/embeddings/` are a feature unrelated to the core goal
The core goal is "GH Actions cron → AI orchestrator → collect events → JSONL." The semantic-search frontend (React app + OpenAI embeddings + HNSW + GitHub Pages) is a completely separate product on top of the data, contributed by another in-flight set of commits (`9066032`, `f421fb1` ahead of `main`).

It's not wrong to ship both, but in the **same repo** they:
- Inflate `npm install` time (`frontend/package.json` pulls in React/Vite/Tailwind on every `actions/checkout`).
- Mix Python (`builder/embeddings/`) into a TypeScript-orchestrator repo.
- Duplicate the workflow's complexity (`build-embeddings` job needs OpenAI API, separate cron behavior).
- Add `docs/search-index/*.bin` files to git history.

**Question for Erik (not a fix):** is the search-frontend feature meant to live here forever, or is it a v0 that should move to `osint-builders/osint-search` or similar? If it stays, this review's recommendations apply to it too. If it moves, half the items in this list collapse.

For now, treat as scope. But:

**Concrete fix regardless of scope:** the `build-embeddings` job in `hourly-collection.yml` should not be inside the workflow named "Hourly OSINT Collection". Move it to `embeddings.yml` with its own trigger (`on: workflow_run` after `hourly-collection.yml` succeeds, or `paths: ['data/events/**']` on push). The current shape couples two unrelated cadences into one workflow file.

### 3.5 `.env.sample` doesn't match the runtime
**File:** `.env.sample`
```
ANTHROPIC_API_KEY=***
WARP_API_KEY=***
WARP_ENVIRONMENT_ID=***
PERPLEXITY_API_KEY=***
TWITTER_BEARER_TOKEN=***
# OPENAI_API_KEY=***
# BROWSERBASE_API_KEY=***
```
Missing: `OSINT_GH_TOKEN` / `GH_TOKEN` (required for push). `OPENAI_API_KEY` is commented out but the embeddings job *requires* it (workflow line 88). `BROWSERBASE_API_KEY` is mentioned but no skill or code reads it.

**Fix:** make `.env.sample` mirror the README's "Configuration" table exactly. Drop unused vars. Add `OSINT_GH_TOKEN`.

### 3.6 Multiple `*.gitignore` files
`.gitignore` (top-level) and `data/.gitignore`. The `data/.gitignore` uses unusual `!` allowlisting. With the current top-level `.gitignore` not blocking `data/**`, the `data/.gitignore` is largely ceremonial.

**Fix:** delete `data/.gitignore`. Roll any genuinely needed exclusions into the top-level file. Saves a confused future-developer's hour.

---

## 4. Skills directory polish (🟢)

After PR-5, the skills tree is in good shape, but a few ragged edges remain:

### 4.1 Three skills still have legacy `references/REFERENCE.md` of varying quality
- `skills/agent-browser/references/REFERENCE.md` — fine, keep.
- `skills/data-to-markdown/references/REFERENCE.md` — overlaps the four sibling reference files (eprime-guide, html-conversion, etc.). Was the index file before they existed.
- `skills/word-event-entities/references/REFERENCE.md` — overlaps `data/SCHEMA.md`.

**Fix:** delete the latter two. Their SKILL.md files already point straight at the more specific references / SCHEMA.md.

### 4.2 `skills/<name>/scripts/*.sh` are demo wrappers, not invoked by the runtime
Each of `agent-browser`, `ffmpeg-cli`, `imagemagick`, `word-event-entities` has a `scripts/` directory with one-off shell examples. They're 20-100 lines apiece, none are referenced by `SKILL.md`, and the runtime agent has no reason to read them.

**Recommended:** they're harmless but they confuse "what does the agent run." Either:
1. Delete them. The bash recipes already live inside `references/*.md`.
2. Or rename `scripts/` → `examples/` so it's clear they're illustrative, not entry points.

### 4.3 `skills/perplexity-search/scripts/` directory is now empty
PR-6 deleted all 3 scripts. The empty directory remains.

**Fix:** `rmdir skills/perplexity-search/scripts`.

### 4.4 SKILL.md `compatibility:` strings are still inconsistent
- Some say `Linux (Ubuntu base, runs inside the Warp Cloud Agent env image; see README.md → "Warp Cloud Agent environment image")` — long and meta-pointing.
- Some skills (`imagemagick`, `ffmpeg-cli`) still say `macOS, Linux, Windows`.
- `agent-browser` has its own `## Installation` section with both npm and Homebrew options.

**Fix:** standardize to one short line: `compatibility: linux (warp-cloud-agent-env-image)`. The README is already the canonical install reference.

---

## 5. Bigger-picture observations (🟢)

### 5.1 The hourly cadence is fixed at `:00`
**File:** `.github/workflows/hourly-collection.yml` cron `0 * * * *`.

If GitHub Actions is busy at `:00 UTC` (it routinely is — popular cron tick), runs queue and start late. The 1-hour lookback window assumes the agent dispatches *exactly* on the hour. A 5-minute queueing delay means events from minute 55-60 are double-counted (they fall inside both runs' windows).

The dedup at Step 5 (URL pre-filter + ID post-dedup) catches this for events with stable URLs, but tweets without canonical URLs may double-count.

**Fix options:**
1. Use a less-popular minute: `7 * * * *` instead of `0 * * * *`.
2. In `builder/index.ts`, derive the time window from `executionTime` floored to the hour, not "now − 1 hour." That makes back-to-back runs deterministically bordered.

### 5.2 Bucket count tunable is asymmetric
`PARALLEL_AGENT_COUNT` is read from `vars`, defaults to `'5'` in the workflow YAML, but the orchestrator's `calculateOptimalBucketCount()` takes `Math.max(configured, minBucketsNeeded)`. With 146 sources, `minBucketsNeeded` is 3, but `PARALLEL_AGENT_COUNT=5` overrides to 5. Each bucket is then ~30 sources, ~440 KB. That's well under the 1 MB cap, so 5 is fine — but it costs 5 Warp agents per hour for what 3 could handle.

**Recommendation:** drop `PARALLEL_AGENT_COUNT` from the workflow (remove the var override), let the orchestrator pick the minimum. Saves 2 Warp invocations × 24 hours × 30 days = ~1440 unnecessary cloud-agent runs/month.

### 5.3 No CI check for prompt drift, schema drift, or skill format
PR-2 added `npm run verify-prompt`. Nothing runs it.

**Fix:** add a `verify` job to `hourly-collection.yml` (and a separate fast PR-only workflow) that runs:
```bash
cd builder && npm ci && npm run verify-prompt
node data/scripts/validate-events.js --all   # after §1.1 fix
./skills/scripts/regenerate-skills-readme.sh && git diff --exit-code skills/README.md
```
3 cheap checks. They prevent every category of issue this review identified.

### 5.4 Dead reference: `data/manifest.json.compatible_versions: ["1.0.x"]`
Implies a versioning contract that nothing enforces. `version: "1.0.0"` is hand-maintained. No code fails on mismatch.

**Fix:** delete both fields, or wire them into `validate-events.js`.

---

## 6. Suggested directory structure (post-cleanup)

After applying the recommendations above:

```
osint/
├── .github/
│   └── workflows/
│       ├── hourly-collection.yml          # only the collect job
│       ├── embeddings.yml                 # split out (see §3.4)
│       ├── create-release.yml             # +cleanup job (§1.4)
│       └── README.md                      # ~50 lines, just secrets+troubleshooting
├── README.md                              # 140 lines, slim (current PR-1 state)
├── AGENTS.md                              # 105 lines, conventions
├── LEARNINGS.md                           # cross-run knowledge base
├── .env.sample                            # exact mirror of README config table
├── .hermes/plans/                         # plan artifacts
├── builder/
│   ├── index.ts                           # orchestrator
│   ├── prompts/
│   │   ├── collection-prompt.md           # canonical runtime prompt
│   │   └── README.md                      # placeholder docs
│   ├── scripts/
│   │   ├── verify-prompt-extraction.ts
│   │   └── __fixtures__/
│   ├── embeddings/                        # (separate concern; see §3.4)
│   ├── package.json
│   └── tsconfig.json
├── source/
│   ├── manifest.json                      # registry (deny-list)
│   ├── CONTRIBUTING.md                    # how to add a source
│   ├── examples/                          # type templates
│   └── sources/                           # individual source specs
├── data/
│   ├── SCHEMA.md                          # canonical entity schema
│   ├── README.md                          # ~80 lines: layout + retention
│   ├── stats.json                         # renamed from manifest.json (§3.2)
│   ├── events/YYYY-MM/YYYY-MM-DD.jsonl
│   ├── media/YYYY-MM/{images,videos}/...
│   ├── indexes/
│   ├── run-logs/YYYY-MM/YYYY-MM-DD.log
│   └── scripts/
│       ├── validate-events.js             # source of truth, geo+E-PRIME enforced
│       ├── stats-report.js
│       ├── rebuild-indexes.js
│       ├── cleanup-old-data.sh            # WIRED INTO create-release.yml
│       └── export-date-range.sh
├── skills/                                # ~10 SKILL.md files, each ≤150 lines
│   ├── README.md                          # auto-generated
│   ├── scripts/regenerate-skills-readme.sh
│   └── <skill>/
│       ├── SKILL.md
│       ├── references/
│       └── examples/                      # renamed from scripts/ (§4.2)
├── frontend/                              # (separate concern; see §3.4)
└── docs/                                  # (search UI; see §3.4)
```

Total expected reduction from current state: **~1500 lines** of redundant docs deleted, **5–6 stale fields** dropped from configs, **3 sync-gap bugs** fixed, **1 dead retention promise** kept.

---

## 7. Recommended PR sequencing

Ordered by "how many other items it unblocks":

| # | Theme | Files | Risk |
|---|---|---|---|
| **A** | **Fix `validate-events.js` + wire it into the prompt** (§1.1) | `data/scripts/validate-events.js`, `builder/prompts/collection-prompt.md`, `data/SCHEMA.md` | medium — touches the runtime |
| **B** | **CI guard PR**: add a `verify` job that runs verify-prompt + validate-events --all + skills/README diff (§5.3) | `.github/workflows/verify.yml` (new) | low |
| **C** | **Token-guard fix** (§1.7) + **paths-ignore cleanup** (§1.2, §1.8) | workflow YAMLs, prompt template | low |
| **D** | **Cross-check fix or removal** (§1.6) | `builder/index.ts`, prompt template | medium |
| **E** | **Doc slim**: workflow README, data README, source README, examples README, embeddings README, create-source/scripts README (§2.1–2.6) | many `.md` | low |
| **F** | **Manifest hygiene**: rename `data/manifest.json` → `data/stats.json`, drop dead fields, drop `last_updated` from `source/manifest.json`, fix empty `events_by_source`/`media_files` (§3.1, §3.2, §3.3, §1.5) | `data/manifest.json`, `data/scripts/*`, prompt template | medium |
| **G** | **Wire `cleanup-old-data.sh`** into `create-release.yml` (§1.4) | `.github/workflows/create-release.yml` | low |
| **H** | **Embeddings split**: move `build-embeddings` into its own workflow file (§3.4) | workflows | low |
| **I** | **Skill polish**: drop empty `scripts/` dirs, dedupe `references/REFERENCE.md`, normalize compatibility strings (§4) | `skills/**` | low |
| **J** | **`.env.sample` rewrite** to mirror README's config table (§3.5) | `.env.sample` | low |

Each PR is independently mergeable. PR-A is the highest-leverage and the only one that needs careful runtime testing.

---

## 8. One-line answer to "anything else I missed?"

> The semantic-search subsystem (`frontend/`, `docs/`, `builder/embeddings/`, the second job in `hourly-collection.yml`) is a separate product cohabiting with the OSINT collector. It's the largest single chunk of complexity in the repo. Decide whether it stays here or moves out before it grows further.
