"""
HNSW index construction and metadata management
"""
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
import numpy as np
import hnswlib


class IndexBuilder:
    def __init__(self, dim: int = 384, space: str = 'ip', m: int = 16, ef_construction: int = 200):
        """
        Initialize HNSW index builder

        Args:
            dim: Embedding dimensionality
            space: Distance metric ('ip' for inner product, 'l2' for Euclidean)
            m: Number of bidirectional links per node
            ef_construction: Size of dynamic candidate list during construction
        """
        self.dim = dim
        self.space = space
        self.m = m
        self.ef_construction = ef_construction
        self.index = None

    def build_index(self, embeddings: np.ndarray) -> hnswlib.Index:
        """
        Build HNSW index from embeddings

        Args:
            embeddings: np.ndarray of shape (n_events, dim)

        Returns:
            hnswlib.Index
        """
        n_elements = len(embeddings)
        print(f"Building HNSW index for {n_elements} events (dim={self.dim})...")

        # Initialize index
        self.index = hnswlib.Index(space=self.space, dim=self.dim)
        self.index.init_index(
            max_elements=n_elements,
            ef_construction=self.ef_construction,
            M=self.m
        )

        # Set ef (search parameter)
        self.index.set_ef(64)

        # Add vectors to index
        ids = np.arange(n_elements)
        self.index.add_items(embeddings, ids)

        print(f"HNSW index built successfully with {self.index.get_current_count()} elements")
        return self.index

    def save_index(self, index_path: Path):
        """Save HNSW index to disk"""
        index_path.parent.mkdir(parents=True, exist_ok=True)
        self.index.save_index(str(index_path))
        print(f"Saved HNSW index to {index_path}")

    def load_index(self, index_path: Path) -> hnswlib.Index:
        """Load existing HNSW index from disk"""
        self.index = hnswlib.Index(space=self.space, dim=self.dim)
        self.index.load_index(str(index_path))
        self.index.set_ef(64)
        print(f"Loaded HNSW index with {self.index.get_current_count()} elements")
        return self.index


def extract_metadata(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extract searchable metadata from events

    Returns: List of metadata dicts in same order as embeddings
    """
    metadata = []

    for event in events:
        item = {
            'id': event['id'],
            'title': event['title'],
            'summary': event['summary'],
            'date_event': event.get('date_event'),
            'date_published': event['date_published'],
            'geo': event.get('geo'),
            'topics': event.get('topics', []),
            'confidence': event.get('confidence'),
            'source_name': event['source']['name']
        }
        metadata.append(item)

    return metadata


def save_metadata(metadata: List[Dict[str, Any]], metadata_path: Path):
    """Save metadata as JSON array"""
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"Saved metadata for {len(metadata)} events to {metadata_path}")


def save_schema(
    schema_path: Path,
    event_count: int,
    embedding_dims: int,
    scale: float,
    min_val: float,
    hnsw_params: Dict[str, Any]
):
    """Save index schema metadata"""
    schema = {
        'version': '1.0.0',
        'embedding_model': 'text-embedding-3-small',
        'embedding_dims': embedding_dims,
        'quantization': 'int8',
        'scale': scale,
        'min_val': min_val,
        'index_type': 'hnsw',
        'hnsw_params': hnsw_params,
        'event_count': event_count,
        'last_updated': datetime.utcnow().isoformat() + 'Z'
    }

    schema_path.parent.mkdir(parents=True, exist_ok=True)
    with open(schema_path, 'w', encoding='utf-8') as f:
        json.dump(schema, f, indent=2)
    print(f"Saved schema to {schema_path}")
