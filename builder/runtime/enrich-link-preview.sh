#!/usr/bin/env bash
# enrich-link-preview.sh — attach a link_preview object to an event from its
# primary URL (links[0]) via the LinkPreview API, with a Twitter profile-banner
# fallback for tweet-only events. Reads one event JSON object on stdin, writes
# compact event JSON on stdout. Always non-blocking: any failure passes the
# event through unchanged.
#
# Env: LINKPREVIEW_API_KEY (optional), TWITTER_BEARER_TOKEN (optional),
#      TWITTER_BANNER_CACHE (default /tmp/twitter-banner-cache.json)
#
# Usage: event_json=$(printf '%s' "$event_json" | bash builder/runtime/enrich-link-preview.sh)
set -uo pipefail

TWITTER_BANNER_CACHE="${TWITTER_BANNER_CACHE:-/tmp/twitter-banner-cache.json}"
[ -f "$TWITTER_BANNER_CACHE" ] || echo '{}' > "$TWITTER_BANNER_CACHE"

event_json=$(jq -c '.')   # read stdin, normalize to compact

# --- LinkPreview API on links[0] ---
if [ -n "${LINKPREVIEW_API_KEY:-}" ]; then
  FIRST_LINK=$(printf '%s' "$event_json" | jq -r '.links[0].url // empty')
  if [ -n "$FIRST_LINK" ]; then
    ENCODED_URL=$(printf '%s' "$FIRST_LINK" | jq -sRr @uri)
    PREVIEW_JSON=$(curl -sf --max-time 8 \
      "https://api.linkpreview.net/?q=$ENCODED_URL" \
      -H "X-Linkpreview-Api-Key: $LINKPREVIEW_API_KEY" 2>/dev/null || echo '{}')
    if echo "$PREVIEW_JSON" | jq -e '.image | type == "string" and length > 0' >/dev/null 2>&1; then
      event_json=$(printf '%s' "$event_json" | jq -c --argjson preview "$PREVIEW_JSON" \
        '. + {link_preview: $preview}')
    fi
    sleep 1  # one request per second — respect rate limits
  fi
fi

# --- Twitter banner fallback when link_preview still lacks an image ---
if [ -n "${TWITTER_BEARER_TOKEN:-}" ]; then
  HAS_IMG=$(printf '%s' "$event_json" | jq -r '.link_preview.image // ""')
  IS_TW=$(printf '%s' "$event_json" | jq -r '.links[0].url // ""' | grep -cE 'x\.com|twitter\.com' || true)
  if [ -z "$HAS_IMG" ] && [ "${IS_TW:-0}" -gt 0 ]; then
    TW_HANDLE=$(printf '%s' "$event_json" | jq -r '.source.name // ""' | grep -oP '(?<=\(@)\w+(?=\))' | head -1)
    if [ -n "$TW_HANDLE" ]; then
      BANNER_URL=$(jq -r --arg h "$TW_HANDLE" '.[$h] // empty' "$TWITTER_BANNER_CACHE" 2>/dev/null)
      if [ -z "$BANNER_URL" ]; then
        BANNER_RESP=$(curl -sf --max-time 8 \
          "https://api.twitter.com/2/users/by/username/$TW_HANDLE?user.fields=profile_banner_url" \
          -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" 2>/dev/null || echo '{}')
        BANNER_URL=$(echo "$BANNER_RESP" | jq -r '.data.profile_banner_url // empty')
        CACHE_TMP=$(jq --arg h "$TW_HANDLE" --arg u "${BANNER_URL:-}" \
          '. + {($h): $u}' "$TWITTER_BANNER_CACHE" 2>/dev/null)
        [ -n "$CACHE_TMP" ] && echo "$CACHE_TMP" > "$TWITTER_BANNER_CACHE"
      fi
      if [ -n "$BANNER_URL" ]; then
        BANNER_IMG="$BANNER_URL/1500x500"
        event_json=$(printf '%s' "$event_json" | jq -c --arg img "$BANNER_IMG" \
          'if .link_preview then .link_preview.image = $img
           else . + {link_preview: {image: $img, title: (.title // ""), description: (.summary // ""), url: (.links[0].url // "")}}
           end')
      fi
    fi
  fi
fi

printf '%s\n' "$event_json"
