#!/bin/bash
# Data extraction workflow: navigate, extract data, export results

# Configuration
URL="https://example.com/products"
OUTPUT="products.json"

echo "1. Navigate to page..."
agent-browser open "$URL"

echo "2. Wait for content to load..."
agent-browser wait --load networkidle

echo "3. Extract structured data with JavaScript..."
agent-browser eval '
return {
  title: document.title,
  products: Array.from(document.querySelectorAll(".product")).map(el => ({
    name: el.querySelector(".product-name")?.textContent,
    price: el.querySelector(".product-price")?.textContent,
    url: el.querySelector("a")?.href,
    inStock: el.querySelector(".in-stock") !== null
  }))
}
' > "$OUTPUT"

echo "4. Extract all links..."
agent-browser eval 'return document.querySelectorAll("a").map(a => a.href)' > links.json

echo "5. Take annotated screenshot..."
agent-browser screenshot --annotate page.png

echo "6. Get page metadata..."
agent-browser eval '
return {
  title: document.title,
  description: document.querySelector("meta[name=description]")?.content,
  canonical: document.querySelector("link[rel=canonical]")?.href
}
' > metadata.json

echo "7. Close browser..."
agent-browser close

echo "Data extraction complete! Results:"
echo "- $OUTPUT"
echo "- links.json"
echo "- metadata.json"
echo "- page.png"
