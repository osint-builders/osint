import type { EventMetadata, SearchResult, SearchFilters } from '../types';

export class SearchEngine {
  private metadata: EventMetadata[] = [];
  private isInitialized = false;

  async initialize(metadata: EventMetadata[]) {
    if (this.isInitialized) return;
    this.metadata = metadata;
    this.isInitialized = true;
  }

  /** Returns all events sorted by event date descending (date_event ?? date_published). */
  getLatest(filters: SearchFilters): SearchResult[] {
    return this.metadata
      .filter(e => this.matchesFilters(e, filters))
      .sort((a, b) =>
        (b.date_event ?? b.date_published ?? '').localeCompare(a.date_event ?? a.date_published ?? '')
      )
      .map(e => ({ ...e, score: 1 }));
  }

  /** Synchronous version for use with React useTransition. */
  searchSync(query: string, filters: SearchFilters): SearchResult[] {
    if (!this.isInitialized) return [];
    if (!query.trim()) return this.getLatest(filters);

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
    return results;
  }

  async search(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    return this.searchSync(query, filters);
  }

  private matchesFilters(event: EventMetadata, filters: SearchFilters): boolean {
    if (filters.dateFrom || filters.dateTo) {
      const eventDate = event.date_event || event.date_published;
      if (!eventDate) return false;
      // Slice to date-only (10 chars) so ISO timestamps like '2026-05-15T14:32Z'
      // compare correctly against date-only filter strings like '2026-05-15'.
      const eventDateOnly = eventDate.slice(0, 10);
      if (filters.dateFrom && eventDateOnly < filters.dateFrom) return false;
      if (filters.dateTo && eventDateOnly > filters.dateTo) return false;
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
