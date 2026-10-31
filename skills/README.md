# Skills

Procedural references for the cloud agent. Each skill lives at `skills/<name>/SKILL.md` with optional `references/` deep-dive files. The agent loads `SKILL.md` on demand from the runtime prompt.

> This file is auto-generated. Do not edit by hand. Run `./skills/scripts/regenerate-skills-readme.sh` after editing any skill's frontmatter.

## Skill index

| Name | Description | Lines |
|---|---|---|
| [`agent-browser`](agent-browser/SKILL.md) | Native Rust CLI for browser automation by Vercel Labs. Automate web navigation, interact with page elements, extract ... | 60 |
| [`create-source`](create-source/SKILL.md) 🛠 | Author concise source specs and manifest entries for the active Identify and Qualify pipeline. Developer tool, not lo... | 43 |
| [`data-to-markdown`](data-to-markdown/SKILL.md) | Transform raw scraped or API data into clean, semantic Markdown for the `contents` field of a World Event Entity. Enf... | 55 |
| [`geocoding`](geocoding/SKILL.md) | Resolve evidence-grounded event locations to coordinates with the repository geocoding helper; reject candidates with... | 40 |
| [`perplexity-search`](perplexity-search/SKILL.md) | Optional source corroboration and location research through Perplexity. Verify cited pages directly before using a fi... | 46 |
| [`remember-as-you-go`](remember-as-you-go/SKILL.md) | Criteria for durable LEARNINGS.md entries versus local run notes. The legacy collection prompt injects these learning... | 105 |
| [`world-event-entities`](world-event-entities/SKILL.md) | Build and validate World Event Entity records (JSONL) representing real-world events with structured metadata, source... | 53 |

🛠 = authoring-only skill, not loaded by the cloud agent during collection runs.

## Adding a new skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`, `license`, `metadata.author`, `metadata.version`, `compatibility`).
2. Keep `SKILL.md` ≤ ~150 lines: Overview / When to use / Entry-point commands / Pitfalls / See also. Push deep content into `references/`.
3. If the skill needs a CLI tool that isn't already in the Warp env image, update the `## Configuration → Warp Cloud Agent environment image` section in [`../README.md`](../README.md) in the same change and rebuild the image before use.
4. Run `./skills/scripts/regenerate-skills-readme.sh` and commit the regenerated `README.md`.
