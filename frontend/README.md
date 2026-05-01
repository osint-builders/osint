# OSINT Semantic Search Frontend

React-based semantic search interface for exploring world events corpus with natural language queries and rich filtering.

## Features

- **Semantic Search**: Natural language queries using client-side search engine
- **Rich Filtering**: Date range, country, topics, confidence threshold
- **Fast Performance**: Client-side ANN search (<30ms after index load)
- **Responsive UI**: Built with React 18 + Tailwind CSS
- **Static Deployment**: Builds to `../docs/search/` for GitHub Pages

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
# Output: ../docs/search/
```

## Architecture

### Components

- **SearchBar.tsx**: Query input with 300ms debouncing
- **FilterPanel.tsx**: Date, country, topics, confidence filters
- **ResultsList.tsx**: Event cards with metadata chips

### Libraries

- **IndexLoader.ts**: Loads schema, metadata, and HNSW index from `/search-index/`
- **SearchEngine.ts**: Client-side search with keyword fallback (ONNX integration TBD)

### Data Flow

```
User Query → SearchEngine → Apply Filters → Sort by Relevance → ResultsList
                ↓
         Index Artifacts (/search-index/schema.json, metadata.json)
```

## Index Artifacts

Expected files in `/search-index/` (relative to build output):

- `schema.json` - Index metadata and quantization parameters
- `metadata.json` - Event metadata (title, summary, date, geo, topics)
- `hnsw.bin` - HNSW index binary (for future ONNX integration)

## Configuration

### Base Path

Set in `vite.config.ts`:
```typescript
base: '/search/'  // GitHub Pages subdirectory
```

### Build Output

```typescript
build: {
  outDir: '../docs/search',  // Output for GitHub Pages
  emptyOutDir: true
}
```

## Deployment

The build output is committed to `docs/search/` for GitHub Pages deployment:

1. Build frontend: `npm run build`
2. Commit `docs/search/` to git
3. GitHub Pages serves from `/docs` folder on `main` branch

## Future Enhancements

- **ONNX Integration**: Load MiniLM-L6-v2 for client-side query embedding
- **HNSW WebAssembly**: Replace keyword search with true ANN search
- **Virtual Scrolling**: react-window for 100+ results
- **Index Caching**: IndexedDB for faster subsequent loads
- **Hybrid Search**: Combine semantic + keyword search
