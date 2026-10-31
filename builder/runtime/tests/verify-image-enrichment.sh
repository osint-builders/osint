#!/usr/bin/env bash
set -euo pipefail

helper="builder/runtime/enrich-link-preview.sh"
cache=$(mktemp)
trap 'rm -f "$cache"' EXIT

fallback=$(printf '%s' '{"title":"Demo","summary":"Demo summary","links":[{"url":"https://example.org/report"}],"image_urls":[]}' \
  | env -u LINKPREVIEW_API_KEY -u TWITTER_BEARER_TOKEN TWITTER_BANNER_CACHE="$cache" bash "$helper")
printf '%s' "$fallback" | jq -e '.image_origin == "default" and .image_urls == ["https://osint.builders/favicon.svg"]' >/dev/null

preview=$(printf '%s' '{"title":"Demo","summary":"Demo summary","links":[{"url":"https://example.org/report"}],"image_urls":[],"link_preview":{"image":"https://example.org/photo.jpg"}}' \
  | env -u LINKPREVIEW_API_KEY -u TWITTER_BEARER_TOKEN TWITTER_BANNER_CACHE="$cache" bash "$helper")
printf '%s' "$preview" | jq -e '.image_origin == "article" and .image_urls == ["https://example.org/photo.jpg"]' >/dev/null

printf '%s' '{"Warshipcam":"https://pbs.twimg.com/profile_banners/123"}' > "$cache"
banner=$(printf '%s' '{"title":"Demo","summary":"Demo summary","source":{"name":"Warshipcam (@Warshipcam)"},"links":[{"url":"https://x.com/Warshipcam/status/123"}],"image_urls":[]}' \
  | env -u LINKPREVIEW_API_KEY TWITTER_BEARER_TOKEN=dummy TWITTER_BANNER_CACHE="$cache" bash "$helper")
printf '%s' "$banner" | jq -e '.image_origin == "source" and .image_urls == ["https://pbs.twimg.com/profile_banners/123/1500x500"]' >/dev/null

echo 'Image enrichment check passed.'
