#!/usr/bin/env python3
"""
Build semantic search index from OSINT world events

This script:
1. Loads all events from data/events/**/*.jsonl
2. Computes fingerprints and detects changed events
3. Generates embeddings using Hugging Face all-MiniLM-L6-v2 (384 dims)
4. L2-normalizes embeddings
5. Saves flat float32 embeddings.bin for the frontend
6. Saves metadata and schema to data/indexes/

Environment variables:
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
from indexer import extract_metadata, save_metadata, save_schema, write_event_detail_files
from utils import (
    compute_fingerprint,
    load_fingerprints,
    save_fingerprints,
    save_embeddings_binary,
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
    output_dir = repo_root / 'data' / 'indexes'

    # Paths for artifacts
    fingerprints_path = output_dir / 'fingerprints.json'
    embeddings_path = output_dir / 'embeddings.bin'
    metadata_path = output_dir / 'metadata.json'
    schema_path = output_dir / 'schema.json'

    print("=" * 60)
    print("OSINT Semantic Search Index Builder")
    print("=" * 60)

    # Step 1: Load all events
    print("\n[1/5] Loading events...")
    all_events = load_all_events(data_dir)

    if not all_events:
        print("No events found. Exiting.")
        sys.exit(0)

    # Step 2: Detect changed events
    print("\n[2/5] Detecting changed events...")
    existing_fingerprints = load_fingerprints(fingerprints_path)

    if existing_fingerprints:
        changed_events = detect_changed_events(all_events, existing_fingerprints)
        print(f"Found {len(changed_events)} changed/new events out of {len(all_events)} total")

        if not changed_events and embeddings_path.exists():
            print("No changes detected and embeddings exist. Exiting.")
            sys.exit(0)
    else:
        print("No existing fingerprints. Processing all events.")
        changed_events = all_events

    # Step 3: Generate embeddings (384-dim, all-MiniLM-L6-v2)
    print("\n[3/5] Generating embeddings...")
    embedder = Embedder()

    texts_to_embed = [
        prepare_embedding_text(event['title'], event['summary'])
        for event in all_events
    ]

    embeddings = embedder.embed_texts(texts_to_embed)
    print(f"Generated embeddings shape: {embeddings.shape}")

    # Step 4: L2-normalize and save embeddings.bin
    print("\n[4/5] Normalizing and saving embeddings...")
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normalized = (embeddings / (norms + 1e-8)).astype(np.float32)
    save_embeddings_binary(normalized, embeddings_path)

    # Step 5: Save metadata and schema
    print("\n[5/5] Saving metadata and schema...")

    # Extract and save metadata
    metadata = extract_metadata(all_events)
    save_metadata(metadata, metadata_path)

    # Write per-event detail files for lazy loading in the frontend
    n_detail = write_event_detail_files(all_events, output_dir)
    print(f"Written {n_detail} event detail files to {output_dir / 'events'}")

    # Save schema
    save_schema(
        schema_path,
        event_count=len(all_events),
        embedding_dims=384,
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
    print(f"Embedding dimensions: 384 (all-MiniLM-L6-v2, native)")
    print(f"\nOutput files:")
    print(f"  - {embeddings_path.relative_to(repo_root)}")
    print(f"  - {metadata_path.relative_to(repo_root)}")
    print(f"  - {schema_path.relative_to(repo_root)}")
    print(f"  - {fingerprints_path.relative_to(repo_root)}")


if __name__ == '__main__':
    main()
