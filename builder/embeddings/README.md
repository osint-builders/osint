# builder/embeddings/

Generates the semantic search index from collected events.

Pipeline: `data/events/**/*.jsonl` → Hugging Face `all-MiniLM-L6-v2` (384-dim, runs locally — no API key) → L2-normalize → flat float32 `embeddings.bin`

Outputs to `data/indexes/`: `embeddings.bin`, `metadata.json`, `schema.json`, `fingerprints.json`, plus per-event detail files under `data/indexes/events/` (gitignored; regenerated at Pages deploy).

See the docstring at the top of `build_index.py` for the canonical pipeline description.

## Run

```bash
pip install -r requirements.txt
python build_index.py
```

## CI

Runs in [`.github/workflows/embeddings.yml`](../../.github/workflows/embeddings.yml) after each collection run completes (chained via `workflow_run`).

## Cost notes

The model runs locally in CI — zero per-event API cost. Fingerprinting in `utils.py` skips runs with no changed events, keeping CI time flat as the corpus grows.

## Files

| File | Purpose |
|---|---|
| `build_index.py` | Entry point: load → fingerprint-diff → embed → save. |
| `embedder.py` | MiniLM wrapper + embedding-text preparation. |
| `indexer.py` | Metadata/schema extraction + per-event detail files. |
| `utils.py` | Fingerprints + binary serialization. |
| `backfill_event_details.py` | Regenerates per-event detail JSON at Pages deploy time. |
