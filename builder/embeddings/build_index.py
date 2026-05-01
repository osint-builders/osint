#!/usr/bin/env python3
"""
Build semantic search index from OSINT world events

This script:
1. Loads all events from data/events/**/*.jsonl
2. Computes fingerprints and detects changed events
3. Generates embeddings using OpenAI text-embedding-3-small
4. Applies PCA dimensionality reduction (1536 → 384 dims)
5. Quantizes embeddings to int8
6. Builds HNSW index for fast ANN search
7. Saves artifacts to docs/search-index/

Environment variables:
  OPENAI_API_KEY - Required for OpenAI API
  REPO_ROOT - Optional, defaults to cwd
"""
import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Any
import numpy as np

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from embedder import Embedder, prepare_embedding_text
from indexer import IndexBuilder, extract_metadata, save_metadata, save_schema
from utils import (
    compute_fingerprint,
    load_fingerprints,
    save_fingerprints,
    load_or_create_pca,
    quantize_embeddings
)


def load_all_events(data_dir: Path) -> List[Dict[str, Any]]:
    """Load all events from JSONL files"""
    events = []
    jsonl_files = sorted(data_dir.glob('**/*.jsonl'))

    print(f"Loading events from {len(jsonl_files)} JSONL files...")

    for jsonl_file in jsonl_files:
        with open(jsonl_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        event = json.loads(line)
                        events.append(event)
                    except json.JSONDecodeError as e:
                        print(f"Warning: Failed to parse line in {jsonl_file}: {e}")

    print(f"Loaded {len(events)} total events")
    return events


def detect_changed_events(
    events: List[Dict[str, Any]],
    existing_fingerprints: Dict[str, str]
) -> List[Dict[str, Any]]:
    """Detect events that have changed since last run"""
    changed_events = []

    for event in events:
        event_id = event['id']
        fingerprint = compute_fingerprint(
            event['title'],
            event['summary'],
            event['contents']
        )

        if existing_fingerprints.get(event_id) != fingerprint:
            changed_events.append(event)

    return changed_events


def main():
    # Configuration
    repo_root = Path(os.environ.get('REPO_ROOT', os.getcwd()))
    data_dir = repo_root / 'data' / 'events'
    output_dir = repo_root / 'docs' / 'search-index'

    openai_api_key = os.environ.get('OPENAI_API_KEY')
    if not openai_api_key:
        print("Error: OPENAI_API_KEY environment variable not set")
        sys.exit(1)

    # Paths for artifacts
    fingerprints_path = output_dir / 'fingerprints.json'
    pca_path = output_dir / 'pca_transform.json'
    hnsw_path = output_dir / 'hnsw.bin'
    metadata_path = output_dir / 'metadata.json'
    schema_path = output_dir / 'schema.json'

    print("=" * 60)
    print("OSINT Semantic Search Index Builder")
    print("=" * 60)

    # Step 1: Load all events
    print("\n[1/8] Loading events...")
    all_events = load_all_events(data_dir)

    if not all_events:
        print("No events found. Exiting.")
        sys.exit(0)

    # Step 2: Detect changed events
    print("\n[2/8] Detecting changed events...")
    existing_fingerprints = load_fingerprints(fingerprints_path)

    if existing_fingerprints:
        changed_events = detect_changed_events(all_events, existing_fingerprints)
        print(f"Found {len(changed_events)} changed/new events out of {len(all_events)} total")

        if not changed_events and hnsw_path.exists():
            print("No changes detected and index exists. Exiting.")
            sys.exit(0)
    else:
        print("No existing fingerprints. Processing all events.")
        changed_events = all_events

    # Step 3: Generate embeddings for changed events
    print("\n[3/8] Generating embeddings...")
    embedder = Embedder(api_key=openai_api_key)

    texts_to_embed = [
        prepare_embedding_text(event['title'], event['summary'])
        for event in all_events
    ]

    embeddings_list = embedder.embed_texts(texts_to_embed)
    embeddings = np.array(embeddings_list, dtype=np.float32)
    print(f"Generated embeddings shape: {embeddings.shape}")

    # Step 4: Apply PCA dimensionality reduction
    print("\n[4/8] Applying PCA dimensionality reduction...")
    pca = load_or_create_pca(pca_path, embeddings, target_dims=384)
    reduced_embeddings = pca.transform(embeddings)
    print(f"Reduced embeddings shape: {reduced_embeddings.shape}")

    # Step 5: Normalize embeddings for inner product search
    print("\n[5/8] Normalizing embeddings...")
    norms = np.linalg.norm(reduced_embeddings, axis=1, keepdims=True)
    normalized_embeddings = reduced_embeddings / (norms + 1e-8)

    # Step 6: Quantize embeddings
    print("\n[6/8] Quantizing embeddings to int8...")
    quantized_embeddings, scale, min_val = quantize_embeddings(normalized_embeddings)
    print(f"Quantized embeddings shape: {quantized_embeddings.shape}, dtype: {quantized_embeddings.dtype}")

    # For indexing, convert back to float32 (HNSW doesn't support int8 directly)
    # The quantization is primarily for storage/transport optimization
    index_embeddings = normalized_embeddings.astype(np.float32)

    # Step 7: Build HNSW index
    print("\n[7/8] Building HNSW index...")
    index_builder = IndexBuilder(dim=384, space='ip', m=16, ef_construction=200)
    index_builder.build_index(index_embeddings)
    index_builder.save_index(hnsw_path)

    # Step 8: Save metadata and schema
    print("\n[8/8] Saving metadata and schema...")

    # Extract and save metadata
    metadata = extract_metadata(all_events)
    save_metadata(metadata, metadata_path)

    # Save schema
    save_schema(
        schema_path,
        event_count=len(all_events),
        embedding_dims=384,
        scale=scale,
        min_val=min_val,
        hnsw_params={'M': 16, 'ef_construction': 200, 'ef': 64, 'space': 'ip'}
    )

    # Update fingerprints
    new_fingerprints = {}
    for event in all_events:
        fingerprint = compute_fingerprint(
            event['title'],
            event['summary'],
            event['contents']
        )
        new_fingerprints[event['id']] = fingerprint

    save_fingerprints(new_fingerprints, fingerprints_path)

    # Summary
    print("\n" + "=" * 60)
    print("Index build complete!")
    print("=" * 60)
    print(f"Events indexed: {len(all_events)}")
    print(f"Embedding dimensions: 384 (reduced from 1536)")
    print(f"Quantization: int8 (scale={scale:.6f}, min={min_val:.6f})")
    print(f"\nOutput files:")
    print(f"  - {hnsw_path.relative_to(repo_root)}")
    print(f"  - {metadata_path.relative_to(repo_root)}")
    print(f"  - {schema_path.relative_to(repo_root)}")
    print(f"  - {fingerprints_path.relative_to(repo_root)}")
    print(f"  - {pca_path.relative_to(repo_root)}")


if __name__ == '__main__':
    main()
