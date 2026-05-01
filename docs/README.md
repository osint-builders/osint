# OSINT Search Interface

This directory contains the static search interface deployed via GitHub Pages.

## Directory Structure

```
docs/
├── search/              # React search UI (built from frontend/)
│   ├── index.html
│   ├── assets/
│   └── models/          # ONNX models (future)
└── search-index/        # Embedding artifacts
    ├── hnsw.bin
    ├── metadata.json
    ├── schema.json
    ├── fingerprints.json
    └── pca_transform.json
```

## GitHub Pages Setup

To enable the search interface:

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main`, Folder: `/docs`
   - Save

2. **Add OpenAI API Secret**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add secret: `OPENAI_API_KEY` with your OpenAI API key

3. **Trigger Initial Build**:
   ```bash
   # Build embedding index locally
   export OPENAI_API_KEY="sk-..."
   python builder/embeddings/build_index.py

   # Build React frontend
   cd frontend
   npm install
   npm run build

   # Commit artifacts
   git add docs/
   git commit -m "Initial search index and frontend build"
   git push
   ```

4. **Access Search UI**:
   - Wait ~1 minute for GitHub Pages deployment
   - Visit: `https://<username>.github.io/<repo>/search/`

## Automation

After initial setup, the embedding pipeline runs automatically:

- **Trigger**: After each hourly collection (via GitHub Actions)
- **Pipeline**: `builder/embeddings/build_index.py`
- **Commit**: Artifacts committed by `build-embeddings` job
- **Deploy**: GitHub Pages auto-deploys from `/docs` folder

## Local Development

See `frontend/README.md` for local development instructions.
