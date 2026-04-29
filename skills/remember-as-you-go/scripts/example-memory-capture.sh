#!/bin/bash

# Example: Remember-As-You-Go Skill in Action
# This script demonstrates when to create memory vs when to skip

MEMORY_FILE="memory.md"

# Function to append memory
add_memory() {
  local entry="$1"
  echo -e "\n$entry\n---\n" >> "$MEMORY_FILE"
  echo "✓ Memory captured"
}

echo "=== Remember-As-You-Go Examples ==="
echo

# Example 1: Smooth execution - NO MEMORY
echo "Example 1: Standard operation"
echo "$ ls -la"
ls -la > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✓ Success on first try"
  echo "→ Skip memory (standard operation)"
fi
echo

# Example 2: Error with resolution - CREATE MEMORY
echo "Example 2: Permission error"
echo "$ docker ps"
docker ps > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "✗ Error: permission denied"
  echo "→ Resolved with: sudo usermod -aG docker \$USER"
  echo "→ CREATE MEMORY (non-obvious fix)"

  MEMORY_ENTRY="## Docker Permission Denied on Linux

Docker commands fail with \"permission denied\" because user not in docker group.

Error:
\`\`\`bash
docker ps
# permission denied while trying to connect to Docker daemon socket
\`\`\`

Solution:
\`\`\`bash
sudo usermod -aG docker \$USER
newgrp docker
docker ps  # Now works
\`\`\`

Context: Only needed once per user on Linux. macOS Docker Desktop handles automatically."

  echo "$MEMORY_ENTRY"
fi
echo

# Example 3: Multiple attempts - CREATE MEMORY
echo "Example 3: FFmpeg codec discovery"
echo "Attempt 1: $ ffmpeg -i video.mp4 output.mkv"
echo "✗ Error: codec not supported"
echo
echo "Attempt 2: $ ffmpeg -i video.mp4 -c:v libx264 output.mkv"
echo "✗ Error: audio codec not supported"
echo
echo "Attempt 3: $ ffmpeg -i video.mp4 -c:v libx264 -c:a aac output.mkv"
echo "✓ Success"
echo "→ CREATE MEMORY (required experimentation)"

MEMORY_ENTRY="## FFmpeg MKV Conversion Requires Explicit Codecs

Converting to MKV without explicit codecs fails with \"codec not supported\".

Trial and error process:
\`\`\`bash
ffmpeg -i input.mp4 output.mkv  # Failed
ffmpeg -i input.mp4 -c:v libx264 output.mkv  # Failed (audio)
ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mkv  # Success
\`\`\`

Context: MKV container requires explicit codec specification unlike MP4."

echo "$MEMORY_ENTRY"
echo

# Example 4: First success - NO MEMORY
echo "Example 4: ImageMagick resize"
echo "$ magick input.jpg -resize 800x600 output.jpg"
echo "✓ Success on first try"
echo "→ Skip memory (worked as documented)"
echo

# Example 5: Environment quirk - CREATE MEMORY
echo "Example 5: Node.js bin script"
echo "$ node bin/perplexity/cli.js --ask 'test'"
echo "✗ Error: PERPLEXITY_API_KEY not set"
echo "→ Required environment variable export"
echo "→ CREATE MEMORY (environment setup)"

MEMORY_ENTRY="## Perplexity CLI Requires API Key Environment Variable

Perplexity CLI fails with \"PERPLEXITY_API_KEY not set\" on first use.

Error:
\`\`\`bash
node bin/perplexity/cli.js --ask \"query\"
# Error: PERPLEXITY_API_KEY environment variable not set
\`\`\`

Solution:
\`\`\`bash
export PERPLEXITY_API_KEY=\"your_key_here\"
node bin/perplexity/cli.js --ask \"query\"  # Now works
\`\`\`

Permanent fix: Add to ~/.zshrc or ~/.bashrc
\`\`\`bash
echo 'export PERPLEXITY_API_KEY=\"your_key\"' >> ~/.zshrc
\`\`\`

Context: Required for all perplexity CLI operations."

echo "$MEMORY_ENTRY"
echo

# Summary
echo "=== Summary ==="
echo
echo "✓ Created memories for:"
echo "  - Docker permission error (non-obvious fix)"
echo "  - FFmpeg codec requirements (experimentation needed)"
echo "  - Perplexity API key setup (environment config)"
echo
echo "✗ Skipped memories for:"
echo "  - ls command (standard operation)"
echo "  - ImageMagick resize (worked as documented)"
echo
echo "Memory file: $MEMORY_FILE"
