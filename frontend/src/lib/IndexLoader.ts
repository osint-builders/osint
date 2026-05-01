import type { IndexSchema, EventMetadata } from '../types';

/**
 * Resolves to the search-index directory for both local dev and GitHub Pages.
 *
 * On Pages the site lives at e.g. https://<owner>.github.io/<repo>/search/,
 * and the index files at https://<owner>.github.io/<repo>/search-index/.
 * Vite injects import.meta.env.BASE_URL = '/<repo>/search/' at build time;
 * trimming the trailing 'search/' and appending 'search-index' lands us
 * on the right sibling directory regardless of repo name.
 *
 * In local dev (`vite`) BASE_URL is '/' and we hit '/search-index' on the
 * dev server, which proxies to docs/search-index/ via the Vite static
 * mount.
 */
function defaultIndexUrl(): string {
  // import.meta.env.BASE_URL is always set by Vite — '/' in dev,
  // whatever `base` is configured as in production (here '/search/').
  const base = import.meta.env.BASE_URL || '/';
  // Strip a trailing 'search/' (or 'search') so we land on the parent
  // path, then append 'search-index'. Works whether base is '/search/'
  // or '/<repo>/search/' or '/'.
  const parent = base.replace(/search\/?$/, '');
  return `${parent}search-index`.replace(/\/+/g, '/');
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
}
