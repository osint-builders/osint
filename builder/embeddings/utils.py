"""
Utility functions for embedding pipeline: fingerprinting, binary I/O
"""
import hashlib
import json
from pathlib import Path
from typing import Dict
import numpy as np


def compute_fingerprint(title: str, summary: str, contents: str) -> str:
    """Compute SHA256 fingerprint for event content"""
    content = f"{title}{summary}{contents}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def load_fingerprints(fingerprints_path: Path) -> Dict[str, str]:
    """Load existing fingerprints from JSON file"""
    if not fingerprints_path.exists():
        return {}

    with open(fingerprints_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_fingerprints(fingerprints: Dict[str, str], fingerprints_path: Path):
    """Save fingerprints to JSON file"""
    fingerprints_path.parent.mkdir(parents=True, exist_ok=True)
    with open(fingerprints_path, 'w', encoding='utf-8') as f:
        json.dump(fingerprints, f, indent=2)


def save_embeddings_binary(embeddings: np.ndarray, path: Path) -> None:
    """
    Save embeddings as a flat float32 row-major binary file.
    Shape [N, 384] is written contiguously so the frontend can memory-map it.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    embeddings.astype(np.float32).tofile(path)
    print(f"Saved embeddings binary ({embeddings.shape}) to {path}")


def strip_markdown(text: str) -> str:
    """Basic Markdown stripping for cleaner embeddings"""
    import re

    # Remove headers
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)

    # Remove bold/italic
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)

    # Remove links
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)

    # Remove inline code
    text = re.sub(r'`(.+?)`', r'\1', text)

    return text.strip()
