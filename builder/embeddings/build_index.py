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

from indexer import extract_metadata, save_metadata, save_schema
from utils import (
    compute_fingerprint,
    save_fingerprints,
    save_embeddings_binary,
)

EMBEDDING_DIMS = 384
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'


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
                        raise ValueError(f"Invalid JSON in {jsonl_file}: {e}") from e

    print(f"Loaded {len(events)} total events")
    return events


def event_fingerprints(events: List[Dict[str, Any]]) -> Dict[str, str]:
    """Keep the existing ID-keyed fingerprint format for compatibility."""
    return {
        event['id']: compute_fingerprint(
            event['title'], event['summary'], event['contents']
        )
        for event in events
    }


def index_artifacts_match(events: List[Dict[str, Any]], output_dir: Path) -> bool:
    """Only skip the model when every stored row still matches the event corpus."""
    fingerprints_path = output_dir / 'fingerprints.json'
    metadata_path = output_dir / 'metadata.json'
    schema_path = output_dir / 'schema.json'
    embeddings_path = output_dir / 'embeddings.bin'
    if not all(path.is_file() for path in (
        fingerprints_path, metadata_path, schema_path, embeddings_path
    )):
        return False
    if embeddings_path.stat().st_size != len(events) * EMBEDDING_DIMS * 4:
        return False

    try:
        with fingerprints_path.open(encoding='utf-8') as file:
            fingerprints = json.load(file)
        with metadata_path.open(encoding='utf-8') as file:
            metadata = json.load(file)
        with schema_path.open(encoding='utf-8') as file:
            schema = json.load(file)
    except (OSError, ValueError):
        return False
    if not isinstance(schema, dict):
        return False

    return (
        fingerprints == event_fingerprints(events)
        and metadata == extract_metadata(events)
        and schema.get('event_count') == len(events)
        and schema.get('embedding_dims') == EMBEDDING_DIMS
        and schema.get('embedding_model') == EMBEDDING_MODEL
        and schema.get('embedding_file') == 'embeddings.bin'
    )


def main():
    # Configuration
    repo_root = Path(os.environ.get('REPO_ROOT', os.getcwd()))
    data_dir = repo_root / 'data' / 'events'
    output_dir = repo_root / 'data' / 'indexes'

    print("=" * 60)
    print("OSINT Semantic Search Index Builder")
    print("=" * 60)

    # Step 1: Load all events
    print("\n[1/5] Loading events...")
    all_events = load_all_events(data_dir)

    # Step 2: Verify the complete ordered artifact set. Fingerprint IDs alone
    # cannot detect a removed row when historical events share an ID.
    print("\n[2/5] Checking current index...")
    if index_artifacts_match(all_events, output_dir):
        print("All index artifacts match the event corpus. Exiting.")
        return

    # Step 3: Generate embeddings. Avoid loading the model for an empty corpus.
    print("\n[3/5] Generating embeddings...")
    if all_events:
        from embedder import Embedder, prepare_embedding_text

        texts_to_embed = [
            prepare_embedding_text(event['title'], event['summary'])
            for event in all_events
        ]
        embeddings = Embedder().embed_texts(texts_to_embed)
        if embeddings.shape != (len(all_events), EMBEDDING_DIMS):
            raise ValueError(f"Unexpected embedding shape: {embeddings.shape}")
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        normalized = (embeddings / (norms + 1e-8)).astype(np.float32)
    else:
        normalized = np.empty((0, EMBEDDING_DIMS), dtype=np.float32)

    # Steps 4-5: Save all four artifacts for the same ordered event corpus.
    print("\n[4/5] Saving embeddings...")
    save_embeddings_binary(normalized, output_dir / 'embeddings.bin')
    print("\n[5/5] Saving metadata, schema, and fingerprints...")
    save_metadata(extract_metadata(all_events), output_dir / 'metadata.json')
    save_schema(output_dir / 'schema.json', len(all_events), EMBEDDING_DIMS)
    save_fingerprints(event_fingerprints(all_events), output_dir / 'fingerprints.json')

    # Summary
    print("\n" + "=" * 60)
    print("Index build complete!")
    print("=" * 60)
    print(f"Events indexed: {len(all_events)}")
    print(f"Embedding dimensions: {EMBEDDING_DIMS} ({EMBEDDING_MODEL}, native)")
    print(f"\nOutput files:")
    for name in ('embeddings.bin', 'metadata.json', 'schema.json', 'fingerprints.json'):
        print(f"  - {(output_dir / name).relative_to(repo_root)}")


if __name__ == '__main__':
    main()
