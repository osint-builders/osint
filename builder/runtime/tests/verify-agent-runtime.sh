#!/usr/bin/env bash
# Check the secret-free Warp CLI preflight without contacting GitHub or Oz.
set -euo pipefail
cd "$(dirname "$0")/../../.."

temp_root=$(cd "${TMPDIR:-/tmp}" && pwd -P)
fixture_dir=$(mktemp -d "$temp_root/osint-agent-runtime-XXXXXX")
cleanup() {
  case "$fixture_dir" in
    "$temp_root"/osint-agent-runtime-*) rm -rf -- "$fixture_dir" ;;
    *) echo "Refusing unexpected cleanup path: $fixture_dir" >&2; exit 1 ;;
  esac
}
trap cleanup EXIT
helper=builder/runtime/init.sh

# The fixture supplies Node and jq so it also runs in local shells that have
# only the Windows installations of those commands on PATH.
cat > "$fixture_dir/node" <<'NODE'
#!/usr/bin/env bash
exit 0
NODE
cat > "$fixture_dir/jq" <<'JQ'
#!/usr/bin/env bash
exit 0
JQ
chmod +x "$fixture_dir/node" "$fixture_dir/jq"
output=$(PATH="$fixture_dir:$PATH" OSINT_GH_TOKEN= GH_TOKEN= \
  bash "$helper" --check-runtime)
[[ "$output" == 'Warp runtime prerequisites available.' ]]

# Presence alone is insufficient: source/image parsing needs PCRE support.
cat > "$fixture_dir/grep" <<'GREP'
#!/usr/bin/env bash
exit 2
GREP
chmod +x "$fixture_dir/grep"
if output=$(PATH="$fixture_dir:$PATH" OSINT_GH_TOKEN= GH_TOKEN= \
  bash "$helper" --check-runtime 2>&1); then
  echo 'Runtime preflight accepted grep without -P support.' >&2
  exit 1
fi
[[ "$output" == *'GNU grep with -P support'* ]]

rm "$fixture_dir/grep"
cat > "$fixture_dir/node" <<'NODE'
#!/usr/bin/env bash
exit 1
NODE
chmod +x "$fixture_dir/node"
if output=$(PATH="$fixture_dir:$PATH" OSINT_GH_TOKEN= GH_TOKEN= \
  bash "$helper" --check-runtime 2>&1); then
  echo 'Runtime preflight accepted an unusable Node.js.' >&2
  exit 1
fi
[[ "$output" == *'Node.js 20 or newer'* ]]

echo 'Warp runtime preflight checks passed.'
