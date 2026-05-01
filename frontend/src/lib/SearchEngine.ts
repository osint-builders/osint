import * as ort from 'onnxruntime-web';
import type { EventMetadata, SearchResult, SearchFilters } from '../types';

export class SearchEngine {
  private session: ort.InferenceSession | null = null;
  private metadata: EventMetadata[] = [];
  private embeddings: Float32Array[] = [];
  private isInitialized = false;

  async initialize(metadata: EventMetadata[]) {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing search engine...');
    this.metadata = metadata;

    // Note: For MVP, we'll use a simplified approach without full ONNX model
    // In production, you would load the ONNX model here:
    // this.session = await ort.InferenceSession.create('/models/MiniLM-L6-v2.onnx');

    // For now, we'll use keyword-based search as fallback
    console.log('Search engine initialized (keyword mode)');
    this.isInitialized = true;
  }

  async search(
    query: string,
    filters: SearchFilters,
    topK: number = 20
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('Search engine not initialized');
    }

    // Simple keyword-based search for MVP
    const lowerQuery = query.toLowerCase();
    const queryTokens = lowerQuery.split(/\s+/).filter(t => t.length > 2);

    const results: SearchResult[] = [];

    for (const event of this.metadata) {
      // Apply filters first
      if (!this.matchesFilters(event, filters)) {
        continue;
      }

      // Compute simple relevance score
      const score = this.computeKeywordScore(event, queryTokens);

      if (score > 0) {
        results.push({ ...event, score });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
  }

  private matchesFilters(event: EventMetadata, filters: SearchFilters): boolean {
    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const eventDate = event.date_event || event.date_published;
      if (!eventDate) return false;

      if (filters.dateFrom && eventDate < filters.dateFrom) return false;
      if (filters.dateTo && eventDate > filters.dateTo) return false;
    }

    // Country filter
    if (filters.country && event.geo?.country !== filters.country) {
      return false;
    }

    // Topics filter
    if (filters.topics.length > 0) {
      const hasMatchingTopic = event.topics.some(t =>
        filters.topics.includes(t)
      );
      if (!hasMatchingTopic) return false;
    }

    // Confidence filter
    if (event.confidence !== null && event.confidence < filters.minConfidence) {
      return false;
    }

    return true;
  }

  private computeKeywordScore(event: EventMetadata, queryTokens: string[]): number {
    const titleLower = event.title.toLowerCase();
    const summaryLower = event.summary.toLowerCase();

    let score = 0;

    for (const token of queryTokens) {
      // Title matches are worth more
      if (titleLower.includes(token)) {
        score += 3;
      }

      // Summary matches
      if (summaryLower.includes(token)) {
        score += 1;
      }

      // Topic matches
      for (const topic of event.topics) {
        if (topic.toLowerCase().includes(token)) {
          score += 2;
        }
      }
    }

    return score;
  }

  getMetadata(): EventMetadata[] {
    return this.metadata;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}
