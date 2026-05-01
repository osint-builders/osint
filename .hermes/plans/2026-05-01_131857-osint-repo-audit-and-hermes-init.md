# OSINT Repo — Hermes Init, Prompt/Markdown Audit & README Triage

**Plan author:** Hermes (plan mode, no execution)
**Workspace:** `~/Projects/osint` (`osint-builders/osint`)
**Date:** 2026-05-01

---

## 0. Scope

You asked for four things. This plan addresses each in order:

1. **Understand the application** → §1 below (architecture map; treat this as the durable memory note since my Hermes memory store is full — see §6).
2. **Initialize the repo with Hermes-specific stuff** → §2.
3. **Find optimizations in the AI-agent markdown** (extract embedded prompts, alignment with core objectives, gaps, inconsistencies) → §3.
4. **Triage `README.md`** (verbose? unintuitive? agents vs humans?) → §4.

Followed by a consolidated execution checklist (§5) and follow-ups (§6).

---

## 1. Application Understanding

### 1.1 What this repo is
An **automated OSINT collection pipeline**. A GitHub Actions cron fires hourly; each run dispatches one or more **Warp Cloud Agents** (Claude Code in a Warp sandbox) that scrape ~140 sources, normalize hits into **World Event Entities** (JSONL + 720×720 PNGs), and commit them back to `data/`.

### 1.2 The runtime in five hops

```
.github/workflows/hourly-collection.yml   (cron @ :00 UTC)
   └─▶ builder/index.ts  (oz-agent-sdk client)
        ├─ loads source/manifest.json (deny-list: skip status ∈ {inactive, archived, deprecated})
        ├─ partitions sources into N "buckets" (sized to fit Warp's 1 MB prompt cap, ~14.5 KB/source)
        └─ for each bucket → spawns a Warp cloud agent with a constructed prompt
              ├─ prompt = template literal in buildCollectionPrompt() (builder/index.ts §125-650+)
              ├─ inlines the full text of every source/sources/<file>.md in the bucket
              ├─ inlines geocoding + perplexity confidence helpers as bash
              └─ agent then:
                   - clones repo
                   - cross-checks sentinel ID list vs live manifest (hard abort on mismatch)
                   - per source: scrape → E-PRIME transform → geocode → confidence-validate → write JSONL
                   - extracts media → ImageMagick normalize to 720×720 PNG
                   - appends a per-bucket run log to memory.md at repo root
                   - commits data/ + memory.md and pushes
```

### 1.3 Components

| Path | Role | Read by humans? | Read by agents? |
|---|---|---|---|
| `README.md` (1075 ln) | Repo intro + huge "Automation Instructions" duplicate of the runtime prompt | ✅ | ❌ (see §4.2 — dead) |
| `builder/index.ts` (805 ln) | Orchestrator, **the actual prompt template lives here** | dev only | n/a (it *generates* the prompt) |
| `source/manifest.json` | Authoritative worklist | ✅ | ✅ (read by orchestrator and agent for cross-check) |
| `source/sources/*.md` | Per-source collection spec (front-matter + body) | ✅ | ✅ (inlined into prompt) |
| `source/README.md`, `source/CONTRIBUTING.md`, `source/examples/*.md` | Author guides for adding sources | ✅ | ❌ |
| `skills/<name>/SKILL.md` | Procedural reference loaded on demand by the cloud agent | ✅ | ✅ (read at runtime via `read_file`) |
| `skills/<name>/references/*.md` | Deep dives, kept out of SKILL.md | dev | ✅ on demand |
| `data/SCHEMA.md` | World Event Entity schema | ✅ | ✅ (referenced by prompt) |
| `data/scripts/*.{js,sh}` | Validators, indexers, exporters | ✅ | optional |
| `memory.md` | Append-only run log + `remember-as-you-go` notes | ✅ | ✅ (read + appended) |
| `.github/workflows/hourly-collection.yml` | Cron entrypoint | ✅ | n/a |

### 1.4 Required environment

| Var | Where | Required |
|---|---|---|
| `WARP_API_KEY` | builder/index.ts (oz-agent-sdk) | ✅ |
| `WARP_ENVIRONMENT_ID` | builder/index.ts | ✅ |
| `ANTHROPIC_API_KEY` | inside Warp env (Claude Code) | ✅ |
| `PERPLEXITY_API_KEY` | inside Warp env (confidence validator, optional) | ⚠ skips quietly if absent |
| `TWITTER_BEARER_TOKEN` | inside Warp env (Twitter API path; agent-browser path doesn't need it) | ⚠ |

### 1.5 Memory note (since my Hermes memory store is full)
Save the §1.1–1.4 block above into Hermes memory after this plan runs (see §6.1 for which existing entry to evict).

---

## 2. Initialize the Repo with Hermes-Specific Stuff

The repo is **not yet Hermes-aware**. We add the following without touching production code paths.

### 2.1 Files to create

| Path | Purpose |
|---|---|
| `AGENTS.md` | Project-context file auto-injected by Hermes when running with `workdir=~/Projects/osint`. Concise (≤120 lines) summary of architecture, conventions, "do/don't", and pointers. |
| `.hermes/plans/.gitkeep` | Ensure plan dir is tracked. |
| `.hermes/plans/README.md` | One-pager: "Plan-mode artifacts live here; safe to delete after merge." |
| `.hermes/skills/.gitkeep` | (Optional) for repo-local Hermes skills if/when we add them. |
| `.cursorrules` (optional) | Mirror of AGENTS.md tail, for Cursor users. |

### 2.2 `.gitignore` additions

```
# Hermes
.hermes/cache/
.hermes/.session*
```
Keep `.hermes/plans/` tracked.

### 2.3 `AGENTS.md` skeleton (proposed — not written yet)

- TL;DR of the runtime (link to `builder/index.ts` as the source of truth, **not** README §63-547).
- "Editing the runtime prompt" → edit `builder/index.ts::buildCollectionPrompt()` (or the extracted template from §3.1).
- "Adding a source" → see `source/CONTRIBUTING.md`.
- "Adding a skill" → SKILL.md must be ≤ ~120 lines; deep content goes in `references/`.
- E-PRIME enforcement, geocoding-required, JSONL fields, deny-list status semantics — one-liners with links.
- Hermes-specific: do NOT use `os.getenv`-style secrets; this repo's secrets flow via GitHub Actions vars.

### 2.4 No code execution
This step is **edits to markdown + .gitignore only**. No CI changes, no rename of existing files.

---

## 3. Markdown / Embedded-Prompt Optimizations

### 3.1 Critical drift: two competing prompt definitions

**The single largest issue in this repo.**

Two places define "what the cloud agent should do," and they have already diverged:

| Source | Lines | Status |
|---|---|---|
| `README.md` §"Automation Instructions" | 63–547 | **Dead.** No code reads it. Last sync ~Apr 29. |
| `builder/index.ts::buildCollectionPrompt()` | 125–650+ | **Live.** This is what actually gets sent to Warp. |

Concrete drift evidence:
- README §Step 1 talks about a single-process `while read source` loop; the live builder uses **bucketed parallel agents** with a sentinel cross-check (no mention of buckets in README).
- README §Step 6 ("Trim memory.md") exists in README but **not** in the live prompt.
- README mentions `oz-agent-sdk` only in the architecture line; it doesn't mention the `MAX_PROMPT_SIZE_BYTES` / 14.5 KB-per-source budgeting that drives the bucketing.
- README has no "geocoding required" gate; the live prompt has a hard validation at Step 4.
- README has no Perplexity confidence-validation step; the live prompt has a 50-call budgeted helper.

**Recommended fix:**

1. **Extract the live prompt out of TypeScript** into `builder/prompts/collection-prompt.md` with `${...}` placeholders for the dynamic bits (`bucketNum`, `totalBuckets`, `expectedIdsList`, `sourceBlocks`, time window, etc.). Load it at runtime via `fs.readFileSync` and run it through a tiny mustache-style replacer (or keep it as a JS template by `eval`-ing the literal — but the markdown file is the canonical version and what humans/AI tools edit).
2. Move the **geocoding bash helper** (currently duplicated in `builder/index.ts`, `skills/geocoding/SKILL.md`, and effectively-also-README) into `builder/prompts/snippets/geocoding.sh` and `include` it into the prompt.
3. Same for the **perplexity confidence validator** → `builder/prompts/snippets/confidence-validation.sh`. Note: line 414 of `builder/index.ts` currently has a typo `$PERPL...KEY` (truncated `$PERPLEXITY_API_KEY`) — fix on extraction.
4. **Delete README §63-547** and replace with a 5-line pointer to `builder/prompts/collection-prompt.md`.

Result: one prompt, version-controlled as markdown, diff-reviewable, no possibility of README/runtime drift.

### 3.2 SKILL.md right-sizing

| Skill | Lines | Has `references/`? | Verdict |
|---|---|---|---|
| `agent-browser` | 297 | ✅ | OK; minor trim possible |
| `create-source` | 787 | ✅ | **Too long.** Split: keep "when to use + entry points" in SKILL.md, push CLI walkthroughs to references/. |
| `data-to-markdown` | 482 | ✅ (4 ref files) | **Too long.** SKILL.md duplicates ref content (E-PRIME rules appear 3×). |
| `ffmpeg-cli` | 343 | ✅ | OK |
| `geocoding` | 500 | ❌ | **Too long + no refs split.** Extract Nominatim/Google examples to `references/`. |
| `image-extraction` | 849 | ❌ | **Largest skill, no refs split.** Worst offender. |
| `imagemagick` | 442 | ✅ | OK |
| `perplexity-search` | 290 | ✅ | OK |
| `remember-as-you-go` | 513 | ✅ + ARCHITECTURE.md + SUMMARY.md + README.md | **Over-documented.** 4 root-level docs is overkill; consolidate to SKILL.md + references/. |
| `word-event-entities` | 488 | ✅ | OK; some duplication w/ `data/SCHEMA.md` (§3.5). |

**Rule of thumb to adopt** (codify in `AGENTS.md`): SKILL.md ≤ ~150 lines, structured as Overview / When to use / Entry-point commands / Pitfalls / Pointers. Anything longer → `references/`. The agent reads SKILL.md *first*; deep details only on demand. This directly reduces per-bucket prompt cost (less inlining when the agent decides to load a skill).

### 3.3 Skills referenced vs skills present

The live prompt only names: `agent-browser`, `perplexity-search`, `data-to-markdown`, `world-event-entities`, `remember-as-you-go`.

Not named in the prompt but present and arguably used: `image-extraction`, `geocoding`, `ffmpeg-cli`, `imagemagick`, `create-source`.

- `image-extraction` & `geocoding` *are* used — the prompt inlines the bash logic inline rather than telling the agent to read those skills. After §3.1's snippet extraction, swap inline bash for a `read skills/geocoding/SKILL.md` instruction.
- `create-source` is purely an authoring tool (humans + dev-time agents). Mark it clearly in its frontmatter as `audience: authoring` so runtime agents skip it.

### 3.4 `skills/README.md` duplication

`skills/README.md` (262 ln) re-describes every skill — but each `SKILL.md` has a `description:` in frontmatter that already does this. Replace `skills/README.md` with an autogenerated table: a 30-line `scripts/regenerate-skills-readme.sh` that greps frontmatter `name:`/`description:` from each `SKILL.md` and emits a table. Run as a pre-commit hook.

### 3.5 Schema duplication: `data/SCHEMA.md` ↔ `skills/word-event-entities/SKILL.md`

Both define the World Event Entity. They overlap ~80%. **Pick one canonical** — recommend `data/SCHEMA.md` (lives next to the data, version-pinned). The skill should shrink to: "schema lives at data/SCHEMA.md; here are the runtime patterns for emitting valid entities (E-PRIME, geo lookup, ID format)."

### 3.6 Other inconsistencies & gaps found

- `.env.sample` has malformed comments (no blank-line separation) and a typo where `OPENAI_API_KEY` and `BROWSERBASE_API_KEY` are jammed onto one line (line 11).
- `.gitignore` references `orchestrator/*.log` and `.langgraph/` but no `orchestrator/` directory exists in the repo. Stale.
- `source/CONTRIBUTING.md` heading hierarchy is broken (h1 "Authentication" appears nested under a step section in §397-415; reads as a top-level doc instead of a sub-section).
- `source/manifest.json` `last_updated` is hand-maintained (currently `2026-04-29`) but the file changes nearly every run. Either remove the field or auto-update on commit.
- The README claims "90-day retention" up top but `data/scripts/cleanup-old-data.sh` is not wired into any workflow. Either wire it into `create-release.yml` or drop the claim.
- `bin/` contains three vendored CLIs (`agent-browser`, `data-to-markdown`, `sandcastle`) with their own `node_modules/` — these inflate the repo. Confirm they're meant to be vendored vs. installed from npm; if the latter, remove `node_modules/` from tracking (already in `.gitignore` but double-check `bin/sandcastle/node_modules` isn't tracked from a prior commit).
- Per-skill `compatibility:` strings mention "macOS, Linux, Windows" but the runtime is **only** GitHub Actions Ubuntu (`ubuntu-latest`). Tighten to reduce noise the agent has to parse.
- `data/manifest.json` exists but I didn't read it; verify it's consistent with `data/SCHEMA.md` (gap: not validated).
- The agent's "Step 8" (extract media) instructs writing to `$WORK_DIR/.../media/images/{event_id}_imgN.png` but the `image_urls` array stores `./media/YYYY-MM/images/YYYY-MM-DD/...`. The path is rewritten during the consolidation step but **the prompt never explicitly states** the rewrite — easy place for an agent to write a path that won't resolve. Document it in the prompt or add a final-pass validator.

### 3.7 Alignment with stated core objectives

README's "Key Capabilities" section claims six things. Reality check:

| Capability claimed | Implemented? | Gap |
|---|---|---|
| Automated hourly collection | ✅ | — |
| Multi-source (Twitter, web, API, RSS, email, webhooks) | partial | webhooks/email/RSS exist as **examples** but no `source/sources/email-*.md`, no `rss-*.md`, no `webhook-*.md`. Today it's Twitter + a handful of webpages. Either downgrade the claim or add sources. |
| Structured Output (WEE) | ✅ | — |
| E-PRIME enforcement | partial | The prompt asks for it; there is **no validator** that fails the run if a "to be" verb appears. Easy add: a regex check in `data/scripts/validate-events.js`. |
| Persistent learning (memory.md) | ✅ but write-only | `memory.md` is only ever appended, never re-read by the *next* run as input. The "remember-as-you-go" skill describes a feedback loop but the loop isn't closed. Either close it (inline last-N entries into the next prompt) or rename the skill to `runtime-logging`. |
| 90-day retention | ❌ | Cleanup script exists, never runs. See §3.6. |

These six gaps are the highest-leverage product-objective alignments to address.

---

## 4. README Triage

### 4.1 Current state

- 1075 lines.
- Mixes three audiences: human first-time visitor (top), human contributor (middle), AI agent runtime (§63-547).
- `grep -nE '^#{1,3} '` shows 50+ headings — the doc tries to be a manual *and* an instruction set *and* a dashboard.

### 4.2 Is it read by agents?

**No.** I traced every code path:
- `builder/index.ts::buildCollectionPrompt()` constructs the prompt from string-literals + manifest + per-source files. It **never** reads README.md.
- The cloud agent inside Warp clones the repo and its instructions tell it to read `data/SCHEMA.md` and selected `skills/<name>/SKILL.md` files. README is not in that list.
- The agent *might* open README.md if it explores the repo (Claude Code is curious), but nothing in the prompt directs it there.

So §63-547 of README ("Automation Instructions") is **dead documentation** that drifts (see §3.1) and confuses humans because it looks authoritative.

### 4.3 Recommended structure

Slim README to ~150–200 lines, human-only:

1. **What this is** (current §1, ~10 lines) — keep.
2. **Status badges** (§48-59) — keep, fix repo URL placeholders.
3. **Quick start** (§17-44) — keep, but trim the "validate after first run" steps to one bullet.
4. **How a run works** (NEW, ~15 lines) — short paragraph with a Mermaid diagram pointing to `builder/index.ts` as the source of truth.
5. **Where things live** (NEW, ~25 lines) — the table from §1.3 of this plan.
6. **Adding a source** (NEW, 5 lines) → link to `source/CONTRIBUTING.md`.
7. **Adding a skill** (NEW, 5 lines) → link to a new `skills/CONTRIBUTING.md` (TBD).
8. **Local development** (current §700+) — keep, trim.
9. **Architecture** (current §548-625, the schema/storage section) — move to `data/SCHEMA.md` (already mostly there) and link.
10. **Drop**: §63-547 ("Automation Instructions"), §628-680 ("Sources/Source Types Supported" — duplicates `source/manifest.json`), most of the inline bash blocks.

Net delete: ~700–800 lines.

### 4.4 Where the deleted content goes

- §63-547 → **deleted** (it's stale; the canonical version after §3.1 is `builder/prompts/collection-prompt.md`).
- §548-625 (schema bits) → already in `data/SCHEMA.md`; just verify and link.
- §700+ (local dev) → keep in README but condense.

---

## 5. Files Likely to Change (consolidated)

### Created
- `AGENTS.md`
- `.hermes/plans/.gitkeep`
- `.hermes/plans/README.md`
- `builder/prompts/collection-prompt.md` (extracted from `builder/index.ts`)
- `builder/prompts/snippets/geocoding.sh`
- `builder/prompts/snippets/confidence-validation.sh`
- `skills/CONTRIBUTING.md` (mirror of `source/CONTRIBUTING.md`)
- `skills/scripts/regenerate-skills-readme.sh`

### Heavily modified
- `README.md` — slim from 1075 → ~200 lines (delete §63-547 entirely).
- `builder/index.ts` — replace inline template literal with `fs.readFileSync` + placeholder substitution.
- `skills/README.md` — replace with autogenerated table.
- `skills/word-event-entities/SKILL.md` — slim by deferring to `data/SCHEMA.md`.
- `skills/image-extraction/SKILL.md` — split into SKILL.md (≤150 ln) + `references/`.
- `skills/geocoding/SKILL.md` — same.
- `skills/create-source/SKILL.md` — same.
- `skills/data-to-markdown/SKILL.md` — dedupe vs its own references/.
- `skills/remember-as-you-go/` — collapse 4 root docs to SKILL.md + 1 reference file.

### Lightly modified
- `.gitignore` — fix stale `orchestrator/` entries, add Hermes cache paths.
- `.env.sample` — fix formatting/typos.
- `source/CONTRIBUTING.md` — fix heading hierarchy ~§397-415.
- `source/manifest.json` — drop or auto-update `last_updated`.
- `.github/workflows/create-release.yml` — wire `data/scripts/cleanup-old-data.sh`.

### Deleted (eventually)
- README.md §63-547 (Automation Instructions block).
- Stale `.gitignore` entries for `orchestrator/`.
- Duplicate skill descriptions in `skills/README.md`.

---

## 6. Validation, Risks, Open Questions

### 6.1 Hermes memory entry to evict
My `memory` store is at 1898/2200. To save the §1 architecture summary I need to evict one. Recommendation: evict the **`pydantic-ai PEP 695 type alias`** entry (467 chars, hai-agents-specific, lowest relevance to osint work). Confirm before I do it.

### 6.2 Validation steps (post-implementation, run by Erik)
1. After §3.1 extraction: `cd builder && npm run collect` with `WARP_API_KEY` unset → should still build the prompt locally and `--dry-run` print it. (Add a `--dry-run` flag in the same PR.)
2. Diff `builder/prompts/collection-prompt.md` (rendered with placeholders filled) against the current live `buildCollectionPrompt()` output — must be byte-identical the first commit, then evolve.
3. After README slim: every link in the new README must resolve (`scripts/check-links.sh`).
4. After SKILL.md splits: agent run-through with a single source still produces a valid event in `data/events/`.
5. E-PRIME validator (new): runs as part of `data/scripts/validate-events.js`; existing data should still pass.

### 6.3 Risks
- **Risk:** `oz-agent-sdk`'s prompt-size measurement is byte-exact; switching from a JS template literal to `fs.readFileSync` + replacement could change line endings (CRLF vs LF) and alter the byte count. Mitigation: enforce LF in `.gitattributes` for `builder/prompts/**`.
- **Risk:** Deleting README §63-547 may break a stakeholder's bookmarks. Mitigation: add an HTML anchor `<a id="automation-instructions">` linking to `builder/prompts/collection-prompt.md` for one release, then remove.
- **Risk:** Slimming `image-extraction/SKILL.md` could regress a behavior the agent currently picks up by accident from the long doc (e.g. "limit to 3-5 images per event"). Mitigation: keep that line in the slim SKILL.md; only move encyclopedic content to references/.
- **Risk:** Auto-regenerating `skills/README.md` adds a pre-commit hook humans must remember. Mitigation: also run it in CI and fail if drifted (`git diff --exit-code skills/README.md`).

### 6.4 Decisions confirmed by Erik (2026-05-01)
1. ✅ Hermes memory entry evicted (pydantic-ai PEP-695); osint architecture note saved.
2. ✅ Prompt extraction format: markdown with `${}` placeholders + a tiny JS replacer (zero new deps).
3. ✅ README §63-547: **hard delete**, no graveyard.
4. ✅ `memory.md` MUST feed the next run, but the **write side needs to change first** — see §7 (new section).
5. ✅ `bin/` directory: **kill it**. CLI tools and references move to the Warp environment setup process for oz-agent-sdk — see §8 (new section).
6. ✅ README is humans-only — short, concise, "what is this" + "how data flows" — see §4 (revised target now in plan body).

---

## 7. `memory.md` Redesign — Closing the Feedback Loop

### 7.1 Current state (broken)

Today `memory.md` is append-only narrative log. Sample of what gets written each bucket:

```
## Processing twitter-the-dailynk (@TheDailyNK)
  - No events parsed
## Processing twitter-raytoribo (@RayToribo)
  - Parsed 3 candidate events
    [skip] dup url: https://www.csis.org/...
  -> 2 events kept
```

This is **operational telemetry**, not learning. It's noise that grows ~5 KB/run × 24 runs/day = ~120 KB/day. Feeding it into the next run's prompt would burn tokens and teach the agent nothing.

### 7.2 New target: two files, two purposes

Split the responsibility:

| File | Purpose | Write rule | Read by next run? |
|---|---|---|---|
| `memory.md` (renamed → `LEARNINGS.md`) | Durable findings, shortcuts, optimization opportunities, suggestions. Cross-run knowledge. | **Append only when something genuinely useful was discovered.** Strict criteria. | ✅ inlined into the next prompt |
| `data/run-logs/YYYY-MM/YYYY-MM-DD.log` (NEW) | Per-run operational telemetry (sources processed, dup skips, parse counts). | Every run, full firehose. | ❌ never |

### 7.3 What qualifies as a `LEARNINGS.md` entry

The agent's prompt must enforce strict criteria. Only write when at least one of these is true:

1. **A source's documented selectors/handle/auth changed** and the new working approach.
   _Example: "twitter-cnn no longer accepts API timeline; agent-browser with `wait --selector article` works."_
2. **A non-obvious shortcut** that saved time/calls.
   _Example: "For `webpage-yahoo-world-news`, og:image is consistently the hero — skip Step 8.1 selector hunt."_
3. **A repeated failure pattern across N≥3 runs** that has a known mitigation.
   _Example: "Nominatim returns 403 if User-Agent is missing; always set `-H 'User-Agent: osint-builders'`."_
4. **Schema/validation gap that bit you** and the workaround until the validator is fixed.
5. **Cost/budget signal** worth surfacing.
   _Example: "Perplexity confidence calls hit budget cap at source #34; demote `topics` filter."_

Explicitly **NOT** in `LEARNINGS.md`:
- Source-by-source "no events parsed" / "kept N events" lines.
- Per-event creation logs (`Created event: evt_…`).
- Time-window snap notes.

Those go to `data/run-logs/`.

### 7.4 Required entry format

```markdown
## YYYY-MM-DD HH:MMZ — <one-line topic>
**Trigger:** <what surfaced this — failure, repeated pattern, optimization spotted>
**Finding:** <what is true, in 1-3 sentences>
**Action for next run:** <concrete instruction the next agent should follow>
**Expires:** <YYYY-MM-DD or "permanent">
```

The `Expires` field lets the prompt-builder filter out stale entries automatically.

### 7.5 Cap & rotation

- Hard cap: 100 entries OR ~30 KB, whichever first.
- Eviction: drop entries past `Expires`, then oldest non-permanent.
- Eviction runs in `builder/index.ts` before the prompt is built; the agent never has to manage the file.

### 7.6 How it feeds the next prompt

In `builder/prompts/collection-prompt.md` (the extracted file from §3.1), add a section near the top:

```markdown
## Prior Learnings (from previous runs)

The following findings from earlier runs apply to this run. Treat them as authoritative
unless they contradict the source files in this prompt:

${learnings}
```

`builder/index.ts` reads `LEARNINGS.md`, filters expired entries, and substitutes.

### 7.7 Files this affects

| Path | Change |
|---|---|
| `memory.md` | rename → `LEARNINGS.md`; rewrite header with the strict criteria & format |
| `data/run-logs/.gitkeep` (new) | dir for per-run telemetry |
| `data/.gitignore` | add `run-logs/*.log.gz` rotation policy |
| `builder/index.ts` | add `loadLearnings()` + cap/expire logic; substitute into prompt |
| `builder/prompts/collection-prompt.md` (new from §3.1) | add `## Prior Learnings` section + write-back instructions to the agent |
| `skills/remember-as-you-go/SKILL.md` | rewrite to teach the new strict-criteria pattern |

---

## 8. `bin/` Directory — Removal & Migration to oz Environment Setup

### 8.1 Current state

`bin/` contains three vendored CLIs, each with its own `node_modules/`:

```
bin/agent-browser/        (used by Warp agent for scraping)
bin/data-to-markdown/     (used by Warp agent for HTML→MD)
bin/sandcastle/           (Vercel sandbox runner — not currently called from runtime?)
```

These get checked out to GitHub Actions on every workflow run **and** they're cloned by the Warp agent. They inflate the repo and pin specific binary versions in two places.

### 8.2 Decision

**Remove `bin/` entirely from the repo.** All CLI tools the cloud agent needs are installed during the **Warp environment setup** for oz-agent-sdk (`WARP_ENVIRONMENT_ID` points at a pre-configured environment image).

### 8.3 Migration steps

1. **Inventory what each `bin/*` CLI provides.** From skill files:
   - `agent-browser`: `agent-browser open|snapshot|screenshot|click|type|...` (skills/agent-browser/SKILL.md §145-191)
   - `data-to-markdown`: a CLI for HTML/text → markdown + E-PRIME validation
   - `sandcastle`: Vercel sandbox spawner — verify whether the runtime actually uses it; if not, delete with no replacement.

2. **Move installation into the Warp environment image setup.** This is configured outside this repo (in the Warp dashboard tied to `WARP_ENVIRONMENT_ID`). The setup script needs to:
   ```bash
   npm install -g agent-browser
   npm install -g data-to-markdown    # if it's published; otherwise install from a release tarball
   apt-get install -y ffmpeg imagemagick jq    # already needed
   ```
   Document the required toolset in `builder/WARP_ENVIRONMENT.md` (new file) so the env image can be rebuilt deterministically.

3. **Delete `bin/`** in the repo.

4. **Update `.gitignore`** — drop the `bin/*/node_modules/` rule (the path will be gone).

5. **Update `skills/agent-browser/SKILL.md`** §"Installation" to point at the Warp environment image rather than the in-repo `bin/`.

6. **Update `.github/workflows/hourly-collection.yml`** — confirm no step depends on `bin/`.

7. **Verify the cloud agent's prompt** never invokes a `./bin/...` path. Currently it doesn't (it uses bare commands like `agent-browser`, `magick`, `ffmpeg`, `jq`), so removal should be a no-op for the runtime once the Warp image has the tools globally.

### 8.4 Risks

- **Risk:** the Warp environment image rebuild is gated by Warp's UI/SDK and isn't in version control. Mitigation: capture the exact install commands in `builder/WARP_ENVIRONMENT.md` and reference it from `AGENTS.md`.
- **Risk:** an in-flight run during the cutover could pick up the old image while the repo no longer has `bin/`. Mitigation: do steps in order — bump Warp env image first, smoke-test one run, then merge the `bin/` deletion PR.

### 8.5 Files this affects

| Action | Path |
|---|---|
| Delete | `bin/agent-browser/`, `bin/data-to-markdown/`, `bin/sandcastle/` |
| Delete | `.sandcastle/` (top-level — appears to be a stale artifact of the same family) |
| Create | `builder/WARP_ENVIRONMENT.md` (canonical install list for the env image) |
| Modify | `.gitignore` (drop `bin/*/node_modules/`) |
| Modify | `skills/agent-browser/SKILL.md` (point at env image, not `bin/`) |
| Modify | `README.md` (drop any mention of `bin/`) |
| Modify | `AGENTS.md` (mention env image is the source of truth for CLI deps) |

---

## 9. Revised PR Sequencing

Replaces §6.5. Five PRs now (was three), ordered by blast radius:

| # | PR | Risk | What ships |
|---|---|---|---|
| 1 | **Hermes init + README slim + .env/.gitignore cleanup** | low | `AGENTS.md`, `.hermes/plans/`, slim README to ~150 lines (humans-only, "what + flow"), fix `.env.sample`, drop stale `orchestrator/` `.gitignore` entries |
| 2 | **Prompt extraction (§3.1)** | medium | `builder/prompts/collection-prompt.md` + `snippets/*.sh`, `builder/index.ts` reads them, `--dry-run` flag, `.gitattributes` LF, byte-identical first commit, fix `$PERPL...KEY` typo |
| 3 | **`memory.md` → `LEARNINGS.md` + run-logs split (§7)** | medium | Rename, new format, cap/expire, per-run logs to `data/run-logs/`, prompt loads learnings, `remember-as-you-go` SKILL.md rewritten |
| 4 | **`bin/` removal + Warp env doc (§8)** | medium | After Warp env image is updated and one smoke-run passes, delete `bin/` and `.sandcastle/`, add `builder/WARP_ENVIRONMENT.md`, update agent-browser skill |
| 5 | **Skill right-sizing + dedupe (§3.2-3.5)** | low | Split oversize SKILL.mds into SKILL.md + `references/`, autogenerate `skills/README.md`, dedupe schema vs `data/SCHEMA.md` |

Each PR is independently revertible.

---

## Appendix B: Updated one-line answers

> **Is the README used by agents or purely for humans?** Purely humans. Slim to ~150 lines: "what this is" + "how data flows" + links.

> **What goes into `memory.md`?** Only durable findings, shortcuts, opportunities, suggestions — formatted with explicit Trigger/Finding/Action/Expires headers, capped at 100 entries / 30 KB. Per-run telemetry moves to `data/run-logs/`. The agent reads filtered LEARNINGS.md at the top of each run.

> **What happens to `bin/`?** Deleted. CLI tools (agent-browser, data-to-markdown, ffmpeg, imagemagick, jq) install into the Warp environment image; the install list is documented in `builder/WARP_ENVIRONMENT.md`.

> **Biggest single optimization?** Still §3.1 — kill the prompt drift between README and `builder/index.ts` by extracting the live prompt to a markdown file. Everything else cleans up downstream.

---

## Appendix A: One-line answers

> **Is the README used by agents or purely for humans?**
> Purely for humans today. The runtime never reads it. Its long "Automation Instructions" section *looks* like agent docs but is dead, drifting, and a maintenance trap. Slim it to humans-only and move the live prompt to `builder/prompts/collection-prompt.md`.

> **Should embedded prompts move to external files?**
> Yes — exactly one: the giant template literal in `builder/index.ts::buildCollectionPrompt()`. Once that's in `builder/prompts/collection-prompt.md`, every other "embedded prompt" in the repo (skills, source files, schema) is already correctly externalized.

> **Biggest single optimization?**
> Kill the prompt drift between `README.md` §63-547 and `builder/index.ts`. Everything else in this plan is downstream of that.
