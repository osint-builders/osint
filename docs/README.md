# OSINT Search Interface — `docs/`

Static search UI deployed to GitHub Pages. Two halves live here:

```
docs/
├── search/         # built React UI (NOT committed; built by pages.yml)
└── search-index/   # embedding artifacts (committed by embeddings.yml)
    ├── hnsw.bin
    ├── metadata.json
    ├── schema.json
    ├── fingerprints.json
    └── pca_transform.json
```

The site appears at `https://<owner>.github.io/<repo>/search/`.

## How it deploys

```
hourly-collection.yml succeeds
        │
        ▼
embeddings.yml         ← rebuilds docs/search-index/ artifacts, commits to main
        │
        ▼   (workflow_run)
pages.yml              ← builds frontend/, uploads docs/ as Pages artifact, deploys
```

`pages.yml` also triggers on:
- `push` to `main` touching `frontend/**`, `docs/search-index/**`, or the workflow itself
- `workflow_dispatch` for manual rebuilds

## One-time setup

1. **Repo Settings → Pages → Source** → set to **`GitHub Actions`** (not "Deploy from a branch").
2. Add `OPENAI_API_KEY` as a repo secret (used by `embeddings.yml`).
3. Push a commit that touches `frontend/`. `pages.yml` runs and the URL appears under Settings → Pages.

After that, every successful collection rebuilds the index and re-deploys automatically.

## Local preview

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173/search/
```

The dev server expects `docs/search-index/` to exist locally (run `python builder/embeddings/build_index.py` once, with `OPENAI_API_KEY` set, to populate it).

To preview the production build:

```bash
cd frontend
npm run build        # writes ../docs/search/
npx serve ../docs    # http://localhost:3000/search/
```

## Why not commit `docs/search/`?

The previous flow (committed build output, Pages source = "main /docs") inflated git history with bundle hashes that change every build. The Actions deployment uploads exactly what gets served and skips the git churn.
