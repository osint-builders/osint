"""
OpenAI embedding generation with batching and rate limiting
"""
import time
from typing import List, Tuple
import openai
from openai import OpenAI


class Embedder:
    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.batch_size = 100  # OpenAI supports up to 2048 inputs per request

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts with batching and retry logic
        """
        all_embeddings = []

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            embeddings = self._embed_batch_with_retry(batch)
            all_embeddings.extend(embeddings)

            if i + self.batch_size < len(texts):
                print(f"Embedded {i + self.batch_size}/{len(texts)} texts...")

        return all_embeddings

    def _embed_batch_with_retry(
        self,
        texts: List[str],
        max_retries: int = 5,
        base_delay: float = 1.0
    ) -> List[List[float]]:
        """
        Embed a batch with exponential backoff retry on rate limits
        """
        for attempt in range(max_retries):
            try:
                response = self.client.embeddings.create(
                    model=self.model,
                    input=texts
                )

                embeddings = [item.embedding for item in response.data]
                return embeddings

            except openai.RateLimitError as e:
                if attempt == max_retries - 1:
                    raise

                delay = base_delay * (2 ** attempt)
                print(f"Rate limit hit, retrying in {delay:.1f}s... (attempt {attempt + 1}/{max_retries})")
                time.sleep(delay)

            except Exception as e:
                print(f"Error embedding batch: {e}")
                raise

        raise RuntimeError("Max retries exceeded for embedding batch")


def prepare_embedding_text(title: str, summary: str) -> str:
    """
    Prepare text for embedding by concatenating title and summary
    """
    from utils import strip_markdown

    # Strip Markdown from summary for cleaner embeddings
    clean_summary = strip_markdown(summary)

    return f"{title} {clean_summary}".strip()
