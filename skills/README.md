# Skills

Procedural references for the cloud agent. Each skill lives at `skills/<name>/SKILL.md` with optional `references/` deep-dive files. The agent loads `SKILL.md` on demand from the runtime prompt.

> This file is auto-generated. Do not edit by hand. Run `./skills/scripts/regenerate-skills-readme.sh` after editing any skill's frontmatter.

## Skill index

| Name | Description | Lines |
|---|---|---|
| [`agent-browser`](agent-browser/SKILL.md) | Native Rust CLI for browser automation by Vercel Labs. Automate web navigation, interact with page elements, extract ... | 297 |
| [`create-source`](create-source/SKILL.md) 🛠 | Authoring tool for creating new OSINT data sources. Provides templates, validation, and tests for source files. Not u... | 67 |
| [`data-to-markdown`](data-to-markdown/SKILL.md) | Transform raw scraped or API data into clean, semantic Markdown for the `contents` field of a World Event Entity. Enf... | 59 |
| [`ffmpeg-cli`](ffmpeg-cli/SKILL.md) | FFmpeg CLI for media processing and transformation. Convert video formats, resize and pad, extract audio, trim by tim... | 343 |
| [`geocoding`](geocoding/SKILL.md) | Extract location mentions from text and convert to lat/lon coordinates using OpenStreetMap Nominatim (free) or Google... | 88 |
| [`image-extraction`](image-extraction/SKILL.md) | Extract, process, and normalize images from any data source for world event entities. Find images in social media, we... | 95 |
| [`imagemagick`](imagemagick/SKILL.md) | ImageMagick CLI for comprehensive image processing and manipulation. Convert formats, resize and crop, apply effects ... | 442 |
| [`perplexity-search`](perplexity-search/SKILL.md) | Perplexity AI search for web search with AI-powered answers, deep research, and chain-of-thought reasoning. Perform d... | 290 |
| [`remember-as-you-go`](remember-as-you-go/SKILL.md) | Strict criteria for what to write into LEARNINGS.md (the cross-run knowledge base read by the next Warp Cloud Agent).... | 102 |
| [`word-event-entities`](word-event-entities/SKILL.md) | Build and validate World Event Entity records (JSONL) representing real-world events with structured metadata, source... | 53 |

🛠 = authoring-only skill, not loaded by the cloud agent during collection runs.

## Adding a new skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`, `license`, `metadata.author`, `metadata.version`, `compatibility`).
2. Keep `SKILL.md` ≤ ~150 lines: Overview / When to use / Entry-point commands / Pitfalls / See also. Push deep content into `references/`.
3. If the skill needs a CLI tool that isn't already in the Warp env image, update the `## Configuration → Warp Cloud Agent environment image` section in [`../README.md`](../README.md) in the same PR and rebuild the image before merge.
4. Run `./skills/scripts/regenerate-skills-readme.sh` and commit the regenerated `README.md`.
