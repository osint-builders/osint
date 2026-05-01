"""
Utility functions for embedding pipeline: fingerprinting, PCA, quantization
"""
import hashlib
import json
import os
from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np
from sklearn.decomposition import PCA


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


def load_or_create_pca(pca_path: Path, embeddings: np.ndarray, target_dims: int = 384) -> PCA:
    """Load existing PCA transform or create new one"""
    if pca_path.exists():
        # Load existing PCA transform
        with open(pca_path, 'r', encoding='utf-8') as f:
            pca_data = json.load(f)

        pca = PCA(n_components=target_dims)
        pca.mean_ = np.array(pca_data['mean'])
        pca.components_ = np.array(pca_data['components'])
        pca.explained_variance_ = np.array(pca_data['explained_variance'])
        print(f"Loaded existing PCA transform from {pca_path}")
    else:
        # Fit new PCA transform
        print(f"Fitting new PCA transform (1536 → {target_dims} dims) on {len(embeddings)} embeddings...")
        pca = PCA(n_components=target_dims)
        pca.fit(embeddings)

        # Save PCA transform
        pca_path.parent.mkdir(parents=True, exist_ok=True)
        pca_data = {
            'mean': pca.mean_.tolist(),
            'components': pca.components_.tolist(),
            'explained_variance': pca.explained_variance_.tolist(),
            'n_components': target_dims,
            'variance_ratio_sum': float(pca.explained_variance_ratio_.sum())
        }
        with open(pca_path, 'w', encoding='utf-8') as f:
            json.dump(pca_data, f)

        print(f"PCA explains {pca.explained_variance_ratio_.sum():.2%} of variance")

    return pca


def quantize_embeddings(embeddings: np.ndarray) -> Tuple[np.ndarray, float, float]:
    """
    Quantize embeddings to int8
    Returns: (quantized_embeddings, scale, min_val)
    """
    min_val = float(embeddings.min())
    max_val = float(embeddings.max())
    scale = 255.0 / (max_val - min_val)

    quantized = ((embeddings - min_val) * scale).astype(np.int8)

    print(f"Quantization: min={min_val:.4f}, max={max_val:.4f}, scale={scale:.4f}")
    return quantized, scale, min_val


def dequantize_embeddings(quantized: np.ndarray, scale: float, min_val: float) -> np.ndarray:
    """Dequantize int8 embeddings back to float32"""
    return (quantized.astype(np.float32) / scale) + min_val


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
