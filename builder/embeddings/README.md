# builder/embeddings/

Generates the semantic search index from collected events.

Pipeline: `events.jsonl` → OpenAI `text-embedding-3-small` → PCA(384) → int8 quantize → HNSW

Output: `docs/search-index/{hnsw.bin, metadata.json, schema.json, fingerprints.json, pca_transform.json}`

See the docstring at the top of `build_index.py` for the canonical pipeline description.

## Run

```bash
pip install -r requirements.txt
export OPENAI_API_KEY="..."
python build_index.py
```

## CI

Runs as the `build-embeddings` job in [`.github/workflows/hourly-collection.yml`](../../.github/workflows/hourly-collection.yml), after each successful collection.

## Cost notes

See comments in `embedder.py` for OpenAI per-event embedding cost. Fingerprinting in `utils.py` skips unchanged events to keep cost flat as the corpus grows.
