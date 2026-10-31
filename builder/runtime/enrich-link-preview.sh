#!/usr/bin/env bash
# Enrich one event JSON object on stdin. API/preview failures stay optional,
# but image_urls[0] must resolve to an image before this helper succeeds.
set -uo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
URL_CHECK="$SCRIPT_DIR/../../data/scripts/lib/qualified-event.js"
DEFAULT_IMAGE='https://osint.builders/favicon.svg'
TWITTER_BANNER_CACHE="${TWITTER_BANNER_CACHE:-/tmp/twitter-banner-cache.json}"
[ -f "$TWITTER_BANNER_CACHE" ] || printf '{}\n' > "$TWITTER_BANNER_CACHE"

if ! event_json=$(jq -ce 'objects' 2>/dev/null); then
  echo 'ERROR: image enrichment requires one JSON object' >&2
  exit 1
fi

# Use the validator's URL guard for the original URL and every redirect hop.
# It rejects credentials, localhost, local hostnames, and IP literals.
safe_image_url() {
  node - "$URL_CHECK" "$1" <<'NODE'
const { isRemoteUrl } = require(process.argv[2]);
process.exit(isRemoteUrl(process.argv[3]) ? 0 : 1);
NODE
}

# HEAD avoids downloading media. Some hosts reject HEAD, so try a one-byte
# ranged GET. Disable automatic redirects and inspect at most two hops.
probe_method() {
  local method="$1" url="$2" hops=0 result rc status mime redirect
  local -a fields
  while (( hops <= 2 )); do
    safe_image_url "$url" || return 1
    if [ "$method" = HEAD ]; then
      result=$(curl --silent --show-error --head --connect-timeout 2 --max-time 4 \
        --max-redirs 0 --proto '=http,https' --proto-redir '=http,https' \
        --output /dev/null \
        --write-out '%{http_code}\n%{content_type}\n%{redirect_url}\n' \
        -- "$url" 2>/dev/null)
      rc=$?
    else
      result=$(curl --silent --show-error --range 0-0 --max-filesize 1 \
        --connect-timeout 2 --max-time 4 --max-redirs 0 \
        --proto '=http,https' --proto-redir '=http,https' \
        --output /dev/null \
        --write-out '%{http_code}\n%{content_type}\n%{redirect_url}\n' \
        -- "$url" 2>/dev/null)
      rc=$?
    fi
    mapfile -t fields <<< "$result"
    status="${fields[0]:-}"
    mime="${fields[1]:-}"
    redirect="${fields[2]:-}"
    status="${status//$'\r'/}"
    mime="${mime//$'\r'/}"
    redirect="${redirect//$'\r'/}"
    if [[ "$status" =~ ^3[0-9][0-9]$ ]] && [ -n "$redirect" ]; then
      url="$redirect"
      ((hops+=1))
      continue
    fi
    [ "$rc" -eq 0 ] && [[ "$status" =~ ^2[0-9][0-9]$ ]] &&
      [[ "${mime,,}" == image/* ]]
    return $?
  done
  return 1
}

image_resolves() {
  safe_image_url "$1" && { probe_method HEAD "$1" || probe_method GET "$1"; }
}

# LinkPreview may provide a working article image when the event's scraped
# image URL has disappeared. Keep its failure nonfatal.
if [ -n "${LINKPREVIEW_API_KEY:-}" ]; then
  first_link=$(printf '%s' "$event_json" | jq -r '.links[0].url // empty')
  if [ -n "$first_link" ]; then
    encoded_url=$(printf '%s' "$first_link" | jq -sRr @uri)
    preview_json=$(curl -sf --connect-timeout 2 --max-time 8 \
      "https://api.linkpreview.net/?q=$encoded_url" \
      -H "X-Linkpreview-Api-Key: $LINKPREVIEW_API_KEY" 2>/dev/null || printf '{}')
    if printf '%s' "$preview_json" | jq -e '.image | type == "string" and length > 0' >/dev/null 2>&1; then
      event_json=$(printf '%s' "$event_json" | jq -c --argjson preview "$preview_json" \
        '. + {link_preview: $preview}')
    fi
    sleep 1
  fi
fi

selected_url=''
selected_origin=''
original_origin=$(printf '%s' "$event_json" | jq -r '.image_origin // "article"')
while IFS= read -r candidate; do
  candidate="${candidate%$'\r'}"
  [ "$candidate" = "$DEFAULT_IMAGE" ] && continue
  if image_resolves "$candidate"; then
    selected_url="$candidate"
    selected_origin=$(if [ "$original_origin" = source ]; then printf source; else printf article; fi)
    break
  fi
done < <(printf '%s' "$event_json" | jq -r '
  .image_urls // [] |
  if type == "array" then .[] | select(type == "string") |
    select(test("[[:space:]]") | not)
  else empty end')

if [ -z "$selected_url" ]; then
  preview_image=$(printf '%s' "$event_json" | jq -r '.link_preview.image // empty')
  if [ "$preview_image" != "$DEFAULT_IMAGE" ] && image_resolves "$preview_image"; then
    selected_url="$preview_image"
    selected_origin=article
  elif [ -n "$preview_image" ]; then
    event_json=$(printf '%s' "$event_json" | jq -c 'del(.link_preview.image)')
  fi
fi

# A Twitter profile banner is source art, never evidence of the event.
if [ -z "$selected_url" ] && [ -n "${TWITTER_BEARER_TOKEN:-}" ]; then
  first_link=$(printf '%s' "$event_json" | jq -r '.links[0].url // ""')
  if [[ "$first_link" =~ ^https?://(x\.com|twitter\.com)/ ]]; then
    handle=$(printf '%s' "$event_json" | jq -r '.source.name // ""' |
      grep -oP '(?<=\(@)\w+(?=\))' | head -1)
    if [ -n "$handle" ]; then
      banner_url=$(jq -r --arg h "$handle" '.[$h] // empty' "$TWITTER_BANNER_CACHE" 2>/dev/null)
      if [ -z "$banner_url" ]; then
        banner_json=$(curl -sf --connect-timeout 2 --max-time 8 \
          "https://api.twitter.com/2/users/by/username/$handle?user.fields=profile_banner_url" \
          -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" 2>/dev/null || printf '{}')
        banner_url=$(printf '%s' "$banner_json" | jq -r '.data.profile_banner_url // empty' 2>/dev/null)
        if [ -n "$banner_url" ]; then
          cache_tmp=$(jq --arg h "$handle" --arg u "$banner_url" \
            '. + {($h): $u}' "$TWITTER_BANNER_CACHE" 2>/dev/null)
          [ -n "$cache_tmp" ] && printf '%s\n' "$cache_tmp" > "$TWITTER_BANNER_CACHE"
        fi
      fi
      if [ -n "$banner_url" ]; then
        for candidate in "$banner_url/1500x500" "$banner_url"; do
          if image_resolves "$candidate"; then
            selected_url="$candidate"
            selected_origin=source
            event_json=$(printf '%s' "$event_json" | jq -c --arg img "$candidate" '
              if .link_preview then .link_preview.image = $img
              else . + {link_preview: {image: $img, title: (.title // ""),
                description: (.summary // ""), url: (.links[0].url // "")}} end')
            break
          fi
        done
      fi
    fi
  fi
fi

if [ -z "$selected_url" ]; then
  if ! image_resolves "$DEFAULT_IMAGE"; then
    echo 'ERROR: no verified event, source, or default image' >&2
    exit 1
  fi
  selected_url="$DEFAULT_IMAGE"
  selected_origin=default
fi

printf '%s' "$event_json" | jq -c --arg img "$selected_url" --arg origin "$selected_origin" \
  '.image_urls = [$img] | .image_origin = $origin'
