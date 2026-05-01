# OSINT Embedding Pipeline

Python-based pipeline for generating semantic embeddings and building HNSW search index from world events JSONL files.

## Overview

This pipeline:

1. **Loads** all events from `data/events/**/*.jsonl`
2. **Detects changes** using SHA256 fingerprints
3. **Generates embeddings** via OpenAI `text-embedding-3-small` (1536 dims)
4. **Reduces dimensions** using PCA (1536 → 384 dims)
5. **Quantizes** embeddings to int8 (8× compression)
6. **Builds HNSW index** for fast ANN search
7. **Saves artifacts** to `docs/search-index/`

## Requirements

```bash
pip install -r requirements.txt
```

Dependencies:
- `openai>=1.12.0` - OpenAI API client
- `numpy>=1.24.0` - Array operations
- `scikit-learn>=1.3.0` - PCA dimensionality reduction
- `hnswlib>=0.8.0` - HNSW index construction

## Usage

```bash
# Set OpenAI API key
export OPENAI_API_KEY="sk-..."

# Run pipeline
python build_index.py

# Or specify repo root
export REPO_ROOT="/path/to/osint"
python build_index.py
```

## Output Files

All artifacts saved to `docs/search-index/`:

- **hnsw.bin** - HNSW index (binary format)
- **metadata.json** - Event metadata (id, title, summary, date, geo, topics)
- **schema.json** - Index schema and quantization parameters
- **fingerprints.json** - SHA256 fingerprints for incremental updates
- **pca_transform.json** - PCA transformation matrix (mean, components, variance)

## Incremental Processing

The pipeline uses fingerprint-based change detection:

1. Compute SHA256 hash of `title + summary + contents` for each event
2. Compare against stored fingerprints
3. Only re-embed events with changed fingerprints
4. Skip index rebuild if no changes detected

This dramatically reduces costs on subsequent runs (~$0.30/day for new events only).

## Cost Estimation

- **Model**: `text-embedding-3-small` ($0.00002 per 1K tokens)
- **Average tokens per event**: ~100 (title + summary)
- **Daily events**: ~150
- **Monthly cost**: ~$9

Breakdown:
```
150 events/day × 100 tokens/event × $0.00002/token × 30 days = $9/month
```

## Performance

- **Embedding generation**: ~5-10 seconds per 100 events (batched)
- **PCA fitting**: <1 second for 1000 events
- **HNSW index build**: <5 seconds for 1000 events
- **Total runtime**: ~2-5 minutes for 1000 events (including API calls)

## Architecture

### Module Structure

- **build_index.py** - Main entry point
- **embedder.py** - OpenAI API client with retry logic
- **indexer.py** - HNSW index construction and metadata extraction
- **utils.py** - Fingerprinting, PCA, quantization utilities

### HNSW Parameters

- **space**: `'ip'` (inner product, for normalized embeddings)
- **M**: 16 (bidirectional links per node)
- **ef_construction**: 200 (construction-time search depth)
- **ef**: 64 (query-time search depth)

These parameters target 95%+ recall@10 while minimizing memory usage.

## Troubleshooting

### OpenAI Rate Limits

The embedder includes exponential backoff retry logic (5 attempts, 1-16s delays).

### Memory Issues

For very large corpora (>100K events):
- Consider batching PCA fitting
- Increase system memory or use cloud VM
- Adjust HNSW max_elements parameter

### Index Size

Expected sizes:
- 1,000 events: ~100KB (384 dims, float32)
- 10,000 events: ~1MB
- 100,000 events: ~10MB

Int8 quantization metadata stored in `schema.json` but not applied to index (HNSW requires float32).

## GitHub Actions Integration

Called by `.github/workflows/hourly-collection.yml` after collection job:

```yaml
- name: Build search index
  run: python builder/embeddings/build_index.py
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    REPO_ROOT: ${{ github.workspace }}
```

Artifacts committed automatically to trigger GitHub Pages rebuild.
