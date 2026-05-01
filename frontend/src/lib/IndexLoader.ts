import type { IndexSchema, EventMetadata } from '../types';

export class IndexLoader {
  private baseUrl: string;

  constructor(baseUrl: string = '/search-index') {
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
}
