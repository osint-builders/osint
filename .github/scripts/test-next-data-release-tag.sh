#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test_root="$(mktemp -d "${TMPDIR:-/tmp}/osint-release-tags.XXXXXX")"
resolved_root="$(realpath "$test_root")"
resolved_tmp="$(realpath "${TMPDIR:-/tmp}")"
if [[ "$resolved_root" != "$resolved_tmp"/osint-release-tags.* ]]; then
  echo "Unsafe temporary test directory: $resolved_root" >&2
  exit 1
fi
trap 'rm -rf -- "$resolved_root"' EXIT

remote_repo="$resolved_root/remote.git"
local_repo="$resolved_root/local"
git init -q --bare "$remote_repo"
git init -q "$local_repo"
git -C "$local_repo" remote add origin "$remote_repo"
tag_target="$(printf 'release tag test' | git -C "$remote_repo" hash-object -w --stdin)"

assert_tag() {
  local expected="$1"
  local actual
  actual="$(cd "$local_repo" && bash "$script_dir/next-data-release-tag.sh" 2026-10-31)"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected $expected, got $actual" >&2
    exit 1
  fi
}

assert_tag data-2026-10-31
git -C "$remote_repo" update-ref refs/tags/data-2026-10-31 "$tag_target"
assert_tag data-2026-10-31-r2
git -C "$remote_repo" update-ref refs/tags/data-2026-10-31-r2 "$tag_target"
git -C "$remote_repo" update-ref refs/tags/data-2026-10-31-r4 "$tag_target"
git -C "$remote_repo" update-ref refs/tags/data-2026-10-30-r99 "$tag_target"
git -C "$remote_repo" update-ref refs/tags/data-2026-10-31-draft "$tag_target"
assert_tag data-2026-10-31-r5

git -C "$local_repo" remote remove origin
if (cd "$local_repo" && bash "$script_dir/next-data-release-tag.sh" 2026-10-31 >/dev/null 2>&1); then
  echo 'Tag selection must fail when the remote cannot be read.' >&2
  exit 1
fi

echo 'Release tag selection passed.'
