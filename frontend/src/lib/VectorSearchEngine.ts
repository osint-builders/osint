import { pipeline as hfPipeline } from '@huggingface/transformers';
import type { VectorSearchResult } from '../types';

interface ProgressState {
  status: string;
  progress: number;
}

type FeatureExtractionPipeline = Awaited<ReturnType<typeof hfPipeline<'feature-extraction'>>>;

export class VectorSearchEngine {
  private embeddings: Float32Array | null = null;
  private dims: number = 384;
  private numEvents: number = 0;
  private pipe: FeatureExtractionPipeline | null = null;
  private _ready: boolean = false;
  private _progress: ProgressState = { status: 'Idle', progress: 0 };

  async initialize(baseUrl: string): Promise<void> {
    try {
      // Phase 1: Load pre-built embeddings
      this._progress = { status: 'Loading embeddings...', progress: 10 };
      const response = await fetch(`${baseUrl}/embeddings.bin`);
      if (!response.ok) {
        throw new Error(`Failed to fetch embeddings: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      this.embeddings = new Float32Array(buffer);
      this.numEvents = buffer.byteLength / (this.dims * 4);
      this._progress = { status: 'Embeddings loaded', progress: 40 };

      // Phase 2: Load the HF feature-extraction model
      this._progress = { status: 'Downloading search model...', progress: 50 };
      this.pipe = await hfPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        dtype: 'q8',
      });
      this._progress = { status: 'Ready', progress: 100 };
      this._ready = true;
    } catch (err) {
      this._progress = { status: `Error: ${err instanceof Error ? err.message : String(err)}`, progress: 0 };
      throw err;
    }
  }

  getProgress(): ProgressState {
    return this._progress;
  }

  async search(query: string, topK: number = 10): Promise<VectorSearchResult[]> {
    if (!this._ready || !this.pipe || !this.embeddings) {
      throw new Error('VectorSearchEngine is not initialized');
    }

    // Embed the query
    const output = await this.pipe(query, { pooling: 'mean', normalize: true });
    const raw = output.tolist() as number[][];
    const queryVec = new Float32Array(raw[0]);

    // L2-normalize (pipeline should already normalize, but be safe)
    let norm = 0;
    for (let i = 0; i < queryVec.length; i++) {
      norm += queryVec[i] * queryVec[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < queryVec.length; i++) {
        queryVec[i] /= norm;
      }
    }

    // Brute-force cosine similarity (embeddings are pre-normalized)
    const scores: VectorSearchResult[] = new Array(this.numEvents);
    for (let i = 0; i < this.numEvents; i++) {
      const offset = i * this.dims;
      scores[i] = {
        index: i,
        score: this.dotProduct(queryVec, this.embeddings, offset, this.dims),
      };
    }

    // Partial sort: find top-K by descending score
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK);
  }

  private dotProduct(
    a: Float32Array,
    b: Float32Array,
    offset: number,
    length: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += a[i] * b[offset + i];
    }
    return sum;
  }
}
