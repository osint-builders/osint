# OSINT Search Frontend

React app for exploring the world-events corpus: keyword + semantic search, map, timeline, and rich filtering. Deployed to GitHub Pages at `https://osint.builders/`.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output: ../docs/ (gitignored; CI builds it fresh per deploy)
```

For working search locally, build the index once (`python builder/embeddings/build_index.py` from the repo root) and copy `data/indexes/` to `docs/indexes/` or serve it at `/indexes/`.

## Architecture

### Key components (`src/components/`)

- `CommandBar.tsx` — query input + actions
- `FilterRail.tsx` — date, country, topic, confidence filters
- `ResultsPane.tsx` / `EventRow.tsx` / `EventDetail.tsx` — results list + detail view
- `MapView.tsx` — MapLibre event map
- `TimelineView.tsx` — chronological visualization
- `SemanticSearchModal.tsx` — vector search UI

### Libraries (`src/lib/`)

- `IndexLoader.ts` — loads `schema.json` + `metadata.json` from `/indexes/`
- `SearchEngine.ts` — keyword search + filtering
- `VectorSearchEngine.ts` — client-side semantic search (transformers.js MiniLM query embedding against `embeddings.bin`)

### Data flow

```
User query → SearchEngine / VectorSearchEngine → filters → ranked results
                ↓
        /indexes/{schema,metadata}.json + embeddings.bin
        (copied from data/indexes/ by deploy-pages.yml at deploy time)
```

## Deployment

Built and deployed by `.github/workflows/deploy-pages.yml`; triggers and concurrency are documented in [`.github/workflows/README.md`](../.github/workflows/README.md). Nothing under `docs/` belongs in git — CI rebuilds it per deploy.
