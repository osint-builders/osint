# Social Media & Webpage Image Sources

## Twitter/X

**Image types**:
- Attached media (photos, videos)
- Profile images
- Quoted tweet images
- Card images

**Extraction methods**:
- API response: extract from `media_url` field
- Direct download: `curl -o image.jpg "$media_url"`
- Embedded images: use agent-browser if not in API

**Example**:
```bash
# From Twitter API response
IMAGE_URL=$(echo "$TWEET_JSON" | jq -r '.entities.media[0].media_url')
curl -o /tmp/tweet_img.jpg "$IMAGE_URL"
```

## Webpage Images

**Types**:
- **Hero images**: primary visual at top of article
- **Thumbnails**: preview images in listings
- **Content images**: inline images within article body
- **Open Graph images**: `<meta property="og:image">`

**Extraction methods**:
- Direct URL: `curl` if accessible
- CSS selectors: target specific image elements
- agent-browser: screenshot for embedded/protected images

**Example**:
```bash
# Extract og:image URL
OG_IMAGE=$(curl -s "$URL" | grep -oP '(?<=og:image" content=")[^"]+')
curl -o /tmp/hero.jpg "$OG_IMAGE"

# Or screenshot specific element
agent-browser open "$URL"
agent-browser snapshot -i  # Find image ref
agent-browser screenshot --element @e1 /tmp/hero.png
```

## Decision Tree: Which Extraction Method?

```
What type of image source?
│
├─ Social Media API (Twitter/X, etc.)
│  └─ Use direct media_url from API response
│     └─ Method: curl download
│     └─ Example: curl -o img.jpg "$media_url"
│
├─ Webpage with <img> tags
│  ├─ Image URL accessible directly?
│  │  └─ Method: curl download
│  │  └─ Example: curl -o img.jpg "$image_src"
│  │
│  └─ Image embedded/protected?
│     └─ Method: agent-browser screenshot --element
│     └─ Example: agent-browser screenshot --element @e1 img.png
│
├─ Video file (.mp4, .mov, .webm)
│  ├─ Video accessible for download?
│  │  └─ Method: FFmpeg frame extraction
│  │  └─ Example: ffmpeg -i video.mp4 -ss 00:00:05 -vframes 1 frame.jpg
│  │
│  └─ Video embedded in page (can't download)?
│     └─ Method: agent-browser screenshot of video element
│     └─ Example: agent-browser screenshot --element @video img.png
│
├─ Interactive content (maps, charts, iframes)
│  └─ Method: agent-browser screenshot with selector
│  └─ Example: agent-browser screenshot --selector ".map" img.png
│
└─ Thumbnail/preview in listing
   ├─ meta[property="og:image"] URL available?
   │  └─ Method: curl download
   │  └─ Example: curl -o img.jpg "$og_image_url"
   │
   └─ CSS selector available?
      └─ Method: agent-browser screenshot --element
      └─ Example: agent-browser screenshot --element @e1 img.png
```

## Image Selection Priority

When multiple images available (e.g., article with many photos):

1. **Primary content image** (REQUIRED) — most relevant to event, hero image or main visual.
2. **Additional context images** (OPTIONAL, up to 3 total recommended) — supporting visuals, different perspectives, key details.
3. **Avoid duplicates** — don't include same image multiple times; skip variations of same shot.
4. **Avoid low-quality** — skip heavily compressed, watermarked (unless only option), pixelated/low-resolution (<300px), placeholder images and icons.
