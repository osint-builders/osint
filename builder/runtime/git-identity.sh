#!/usr/bin/env bash
# git-identity.sh — the one place the pipeline's commit identity is defined.
#
# Every automated commit that reaches main is authored by the repo owner:
#   osint-builders <admin@osint.builders>
#
# Call sites: builder/runtime/submit.sh (collect + qualify), identify.yml,
# embeddings.yml, create-release.yml. Per-stage bot identities used to imply a
# trust boundary that does not exist — anything holding the push token can
# claim any author — while making the audit's job harder.
#
# Usage (from the repo root): bash builder/runtime/git-identity.sh
#
# NOTE: this writes repo-local git config, so it persists for the rest of the
# clone's life. That is fine for the ephemeral pipeline checkouts that call it.
# If you are doing development work in a checkout where this has run, reset
# your own identity before committing — otherwise your source commits are
# attributed to the pipeline and trip .github/scripts/audit-commits.sh.
set -euo pipefail

git config user.name "osint-builders"
git config user.email "admin@osint.builders"
