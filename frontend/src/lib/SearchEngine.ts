import type { EventMetadata, SearchResult, SearchFilters } from '../types';

export class SearchEngine {
  private metadata: EventMetadata[] = [];
  private isInitialized = false;

  async initialize(metadata: EventMetadata[]) {
    if (this.isInitialized) return;
    this.metadata = metadata;
    this.isInitialized = true;
  }

  /** Returns the most recent N events sorted by date_published descending. */
  getLatest(topK = 100, filters: SearchFilters): SearchResult[] {
    const filtered = this.metadata
      .filter(e => this.matchesFilters(e, filters))
      .sort((a, b) => {
        const da = a.date_published ?? '';
        const db = b.date_published ?? '';
        return db.localeCompare(da);
      })
      .slice(0, topK);
    return filtered.map(e => ({ ...e, score: 1 }));
  }

  async search(
    query: string,
    filters: SearchFilters,
    topK = 100
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) throw new Error('Search engine not initialized');
    if (!query.trim()) return this.getLatest(topK, filters);

    const queryTokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 1);

    const results: SearchResult[] = [];
    for (const event of this.metadata) {
      if (!this.matchesFilters(event, filters)) continue;
      const score = this.computeKeywordScore(event, queryTokens);
      if (score > 0) results.push({ ...event, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  private matchesFilters(event: EventMetadata, filters: SearchFilters): boolean {
    if (filters.dateFrom || filters.dateTo) {
      const eventDate = event.date_event || event.date_published;
      if (!eventDate) return false;
      if (filters.dateFrom && eventDate < filters.dateFrom) return false;
      if (filters.dateTo && eventDate > filters.dateTo) return false;
    }
    if (filters.country && event.geo?.country !== filters.country) return false;
    if (filters.topics.length > 0) {
      const hasMatch = event.topics.some(t => filters.topics.includes(t));
      if (!hasMatch) return false;
    }
    if (filters.minConfidence > 0) {
      const conf = event.confidence ?? 0;
      if (conf < filters.minConfidence) return false;
    }
    return true;
  }

  private computeKeywordScore(event: EventMetadata, tokens: string[]): number {
    const title = event.title.toLowerCase();
    const summary = event.summary.toLowerCase();
    const source = event.source_name.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (title.includes(token)) score += 4;
      if (summary.includes(token)) score += 1;
      if (source.includes(token)) score += 2;
      for (const topic of event.topics) {
        if (topic.toLowerCase().includes(token)) score += 3;
      }
      const geo = event.geo;
      if (geo) {
        const geoStr = [geo.country, geo.region, geo.city].filter(Boolean).join(' ').toLowerCase();
        if (geoStr.includes(token)) score += 2;
      }
    }
    return score;
  }

  getMetadata(): EventMetadata[] { return this.metadata; }
  isReady(): boolean { return this.isInitialized; }
}
