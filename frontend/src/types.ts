export interface EventLink {
  url: string;
  label?: string;
}

export interface LinkPreview {
  title: string;
  description: string;
  image: string;
  url: string;
}

export interface EventMetadata {
  id: string;
  title: string;
  summary: string;
  date_event: string | null;
  date_published: string;
  geo: {
    lat: number | null;
    lon: number | null;
    country?: string;
    region?: string;
    city?: string;
  } | null;
  topics: string[];
  confidence: number | null;
  source_name: string;
  links?: EventLink[];
  link_preview_image?: string | null;
}

export interface SearchFilters {
  dateFrom: string | null;
  dateTo: string | null;
  country: string | null;
  topics: string[];
  minConfidence: number;
}

export interface SearchResult extends EventMetadata {
  score: number;
}

export interface IndexSchema {
  version: string;
  embedding_model: string;
  embedding_dims: number;
  embedding_file: string;
  event_count: number;
  last_updated: string;
}

export interface EventDetail extends EventMetadata {
  contents: string;
  image_urls: string[];
  source: {
    name: string;
    provider?: string;
    email?: string;
  };
  ingested_at?: string;
  link_preview?: LinkPreview | null;
}

export interface SavedSearch {
  id: string;
  label: string;
  query: string;
  filters: SearchFilters;
  savedAt: string;
}

export interface VectorSearchResult {
  index: number;
  score: number;
}

export type SortField = 'date' | 'title' | 'confidence';
export type SortDirection = 'asc' | 'desc';
export interface SortEntry { field: SortField; dir: SortDirection; }

// ── Popout / multi-window primitives ──────────────────────────

/** Panels that can be popped out into separate windows. */
export type PanelId = 'filters' | 'map' | 'detail' | 'timeline' | 'results';

/** Default window geometry per panel (width × height) + window title. */
export const PANEL_DEFAULTS: Record<PanelId, { width: number; height: number; title: string }> = {
  filters:  { width: 280, height: 700, title: 'OSINT // Filters' },
  map:      { width: 800, height: 600, title: 'OSINT // Map View' },
  detail:   { width: 480, height: 700, title: 'OSINT // Event Detail' },
  timeline: { width: 900, height: 600, title: 'OSINT // Timeline' },
  results:  { width: 600, height: 700, title: 'OSINT // Results' },
};

/**
 * Messages sent over BroadcastChannel('osint-sync').
 * Parent → children: full state snapshots.
 * Children → parent: action dispatches.
 */
export type BroadcastMessage =
  | { type: 'state'; payload: PopoutSyncState }
  | { type: 'action'; payload: PopoutAction }
  | { type: 'ready' };

/** Subset of App state that parent broadcasts to popout children. */
export interface PopoutSyncState {
  results: SearchResult[];
  selectedId: string | null;
  filters: SearchFilters;
  query: string;
  eventDetail: EventDetail | null;
  isLoadingDetail: boolean;
  sorts: SortEntry[];
  rightPane: 'map' | 'detail';
  view: 'search' | 'timeline';
}

/** Actions a popout child can dispatch back to the parent. */
export type PopoutAction =
  | { kind: 'select'; id: string }
  | { kind: 'open'; id: string }
  | { kind: 'tagClick'; tag: string }
  | { kind: 'popIn'; panel: PanelId }
  | { kind: 'setFilters'; filters: SearchFilters }
  | { kind: 'setQuery'; query: string }
  | { kind: 'setSort'; field: SortField; dir: SortDirection }
  | { kind: 'clearSorts' };
