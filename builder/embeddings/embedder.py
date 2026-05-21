"""
Embedding generation using Hugging Face sentence-transformers
"""
from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer


class Embedder:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2', batch_size: int = 128):
        self.model = SentenceTransformer(model_name)
        self.batch_size = batch_size

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts with batching.
        Returns np.ndarray of shape (len(texts), 384).
        """
        print(f"Encoding {len(texts)} texts with batch_size={self.batch_size}...")
        embeddings = self.model.encode(
            texts,
            batch_size=self.batch_size,
            show_progress_bar=True,
            convert_to_numpy=True,
        )
        return embeddings


def prepare_embedding_text(title: str, summary: str) -> str:
    """
    Prepare text for embedding by concatenating title and summary
    """
    from utils import strip_markdown

    # Strip Markdown from summary for cleaner embeddings
    clean_summary = strip_markdown(summary)

    return f"{title} {clean_summary}".strip()
