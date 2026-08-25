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
        (copied from data/indexes/ by deploy-downstream.yml at deploy time)
```

## Deployment

`.github/workflows/deploy-downstream.yml` (`pages-build`/`pages-deploy` jobs) builds the frontend, copies `data/indexes/` → `docs/indexes/`, and uploads `docs/` as the Pages artifact. Nothing under `docs/` belongs in git.
