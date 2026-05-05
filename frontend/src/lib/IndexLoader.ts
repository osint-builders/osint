import type { IndexSchema, EventMetadata } from '../types';

/**
 * Resolves to the indexes/ directory for both local dev and production.
 *
 * The site is deployed at https://osint.builders/ (root path).
 * Index files are at https://osint.builders/indexes/.
 * Vite injects import.meta.env.BASE_URL = '/' at build time.
 */
function defaultIndexUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}indexes`.replace(/\/+/g, '/');
}

export class IndexLoader {
  private baseUrl: string;

  constructor(baseUrl: string = defaultIndexUrl()) {
    this.baseUrl = baseUrl;
  }

  async loadSchema(): Promise<IndexSchema> {
    const response = await fetch(`${this.baseUrl}/schema.json`);
    if (!response.ok) {
      throw new Error(`Failed to load schema: ${response.statusText}`);
    }
    return response.json();
  }

  async loadMetadata(): Promise<EventMetadata[]> {
    const response = await fetch(`${this.baseUrl}/metadata.json`);
    if (!response.ok) {
      throw new Error(`Failed to load metadata: ${response.statusText}`);
    }
    return response.json();
  }

  async loadHNSWIndex(): Promise<ArrayBuffer> {
    const response = await fetch(`${this.baseUrl}/hnsw.bin`);
    if (!response.ok) {
      throw new Error(`Failed to load HNSW index: ${response.statusText}`);
    }
    return response.arrayBuffer();
  }

  async loadEventDetail(id: string): Promise<import('../types').EventDetail> {
    const response = await fetch(`${this.baseUrl}/events/${id}.json`);
    if (!response.ok) {
      throw new Error(`Event detail not found: ${id}`);
    }
    return response.json();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
