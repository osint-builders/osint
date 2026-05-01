# Warp Environment Setup

The hourly collection runs inside a **Warp Cloud Agent** environment image
identified by `$WARP_ENVIRONMENT_ID`. That image — not this repo — is the
canonical place to install CLI tools, system packages, and bake in
sensitive environment variables. This document is the canonical install
list so the image can be rebuilt deterministically.

> If you change this document and the running Warp env image, update both
> in the same change. Drift between this file and the image is the most
> likely cause of "the agent ran fine yesterday and broke today" failures.

## Contents this image must provide

### Node.js / npm

- Node.js **≥ 20** (LTS), with `npm`.
- `npx` available on `$PATH`.

### Global npm packages

```bash
npm install -g agent-browser
agent-browser install      # downloads Chrome for Testing
```

`agent-browser` is the Rust-backed browser-automation CLI used by the
collection skills. The follow-up `agent-browser install` step is required;
without it, the first scrape attempt fails with "Chrome binary not found".

### System packages (apt-get on Ubuntu base image)

```bash
apt-get update
apt-get install -y \
    git \
    curl \
    jq \
    bc \
    ffmpeg \
    imagemagick \
    ca-certificates
```

- `jq` is required by every step in the collection prompt.
- `bc` is required by the runtime confidence-validation helper (Step 3.6 of
  the prompt) for floating-point comparisons.
- `ffmpeg` is used by `skills/image-extraction` for video frame extraction.
- `imagemagick` provides the `magick` CLI used to normalize every event
  image to 720×720 PNG.

### Python (optional, only if `builder/embeddings/` runs in the same image)

```bash
apt-get install -y python3 python3-pip
# Embedding pipeline deps installed via builder/embeddings/requirements.txt
# at workflow runtime; nothing to bake in here unless you want a warm
# pip cache.
```

## Environment variables baked into the image

These must be set as Warp environment-level secrets so the cloud agent can
read them without any additional plumbing:

| Variable | Purpose | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API used by Claude Code inside the Warp agent | ✅ |
| `PERPLEXITY_API_KEY` | Runtime confidence-validation queries (Step 3.6) | optional — degrades gracefully |
| `TWITTER_BEARER_TOKEN` | Twitter API path for Twitter sources (agent-browser path doesn't need it) | optional |
| `OSINT_GH_TOKEN` *or* `GH_TOKEN` | Fine-grained PAT with `Contents:write` on `osint-builders/osint`, used to push the run's commits | ✅ |

The orchestrator passes additional context (`WARP_API_KEY`,
`WARP_ENVIRONMENT_ID`, `REPO_ROOT`) via the SDK call itself, so those do
**not** need to live in the image.

## What does NOT belong in the image

- The repo content. The agent clones it on Step 0 of the prompt.
- The `bin/` directory in this repo. Once this image carries
  `agent-browser` globally, the in-repo `bin/agent-browser/` is dead
  weight; same for `bin/data-to-markdown/` and `bin/sandcastle/`. Removal
  is gated on this image being current — see "Migrating off `bin/`" below.

## Verifying the image

Start a one-off Warp run with this throwaway prompt and confirm every
command succeeds:

```bash
node --version            # ≥ 20
npm --version
agent-browser --version
ffmpeg -version | head -1
magick --version | head -1
jq --version
bc --version | head -1
git --version
test -n "$ANTHROPIC_API_KEY" && echo "ANTHROPIC_API_KEY set"
test -n "$OSINT_GH_TOKEN" -o -n "$GH_TOKEN" && echo "push token set"
```

A green run on the throwaway prompt is required before any production
collection run uses the new image.

## Migrating off `bin/`

The repo currently vendors three CLIs under `bin/` (`agent-browser/`,
`data-to-markdown/`, `sandcastle/`), each with its own `node_modules/`.
They date from before the Warp env image carried CLIs globally and are
now redundant.

The agreed migration sequence is:

1. **Update the Warp env image** with the install list above. Verify with
   the throwaway prompt.
2. **Run one production collection** with the new image. Confirm green
   in `data/events/`.
3. **Open a follow-up PR** that deletes `bin/` and `.sandcastle/` and
   updates `skills/agent-browser/SKILL.md` to point at this document
   rather than the in-repo install path.

This document and PR exist; steps 1-3 happen outside the repo (in the
Warp dashboard) and in the follow-up PR.

## When this list changes

When you add a CLI dependency in a new skill, update this document **in
the same PR** and tag the reviewer to update the Warp env image before
merge. The collection prompt does not introspect the env at runtime — if
a tool is missing, the agent fails partway through a bucket and
truncates the run.
