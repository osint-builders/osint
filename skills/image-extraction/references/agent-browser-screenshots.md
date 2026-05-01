# Agent-Browser Screenshots for Interactive/Embedded Media

## Types
- iframe content (maps, charts, embeds)
- Map screenshots
- Chart/visualization captures
- Dashboard screenshots

## Method
- agent-browser screenshot with element selector
- Wait for content to load before capturing

## Basic Example

```bash
# Screenshot embedded map
agent-browser open "$URL"
agent-browser wait --selector ".map-container"
agent-browser wait --timeout 3000  # Additional load time
agent-browser screenshot --selector ".map-container" /tmp/map.png
```

## Multiple Images from a Webpage

```bash
# 1. Open webpage with agent-browser
agent-browser open https://example.com/article

# 2. Get snapshot to find image elements
agent-browser snapshot -i
# Output shows: image [ref=e1], image [ref=e2], image [ref=e3]

# 3. Screenshot each image
agent-browser screenshot --element @e1 /tmp/img1.png
agent-browser screenshot --element @e2 /tmp/img2.png
agent-browser screenshot --element @e3 /tmp/img3.png

# 4. Process batch
for i in 1 2 3; do
  magick /tmp/img${i}.png \
    -resize 720x720^ \
    -gravity center \
    -extent 720x720 \
    +repage \
    -strip \
    -define png:compression-level=9 \
    evt_20260429_001_img${i}.png
done

# 5. Update event entity
jq '.image_urls += [
  "./media/2026-04/images/2026-04-29/evt_20260429_001_img1.png",
  "./media/2026-04/images/2026-04-29/evt_20260429_001_img2.png",
  "./media/2026-04/images/2026-04-29/evt_20260429_001_img3.png"
]' event.json > event.json.tmp && mv event.json.tmp event.json
```

## Embedded Map Full Pipeline

```bash
# 1. Open page with embedded map
agent-browser open https://example.com/map-page

# 2. Wait for map to load
agent-browser wait --selector ".map-container"
agent-browser wait --timeout 3000  # Additional time for tiles to load

# 3. Screenshot map element
agent-browser screenshot --selector ".map-container" /tmp/map.png

# 4. Process to 720x720 PNG
magick /tmp/map.png \
  -resize 720x720^ \
  -gravity center \
  -extent 720x720 \
  +repage \
  -strip \
  -define png:compression-level=9 \
  evt_20260429_001_img1.png

# 5. Cleanup
rm /tmp/map.png
```

## Tips
- Always wait for selector + extra timeout for tile/chart rendering.
- Retry once with longer wait if screenshot fails before falling back.
