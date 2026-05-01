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
  quantization: string;
  scale: number;
  min_val: number;
  index_type: string;
  hnsw_params: {
    M: number;
    ef_construction: number;
    ef: number;
    space: string;
  };
  event_count: number;
  last_updated: string;
}
