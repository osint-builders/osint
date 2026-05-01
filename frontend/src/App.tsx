import React, { useState, useEffect, useCallback } from 'react';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { ResultsList } from './components/ResultsList';
import { IndexLoader } from './lib/IndexLoader';
import { SearchEngine } from './lib/SearchEngine';
import type { SearchResult, SearchFilters, EventMetadata } from './types';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allMetadata, setAllMetadata] = useState<EventMetadata[]>([]);
  const [searchEngine] = useState(() => new SearchEngine());
  const [filters, setFilters] = useState<SearchFilters>({
    dateFrom: null,
    dateTo: null,
    country: null,
    topics: [],
    minConfidence: 0
  });

  // Initialize search engine
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        console.log('Loading search index...');

        const loader = new IndexLoader();
        const [schema, metadata] = await Promise.all([
          loader.loadSchema(),
          loader.loadMetadata()
        ]);

        console.log(`Loaded ${metadata.length} events (index version ${schema.version})`);

        await searchEngine.initialize(metadata);
        setAllMetadata(metadata);
        setIsInitializing(false);
      } catch (err) {
        console.error('Failed to initialize search engine:', err);
        setError(err instanceof Error ? err.message : 'Failed to load search index');
        setIsInitializing(false);
      }
    };

    init();
  }, [searchEngine]);

  // Perform search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const searchResults = await searchEngine.search(query, filters, 50);
      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [searchEngine, filters]);

  // Re-run search when filters change
  useEffect(() => {
    if (results.length > 0) {
      // Re-search with current query would require storing query state
      // For MVP, we'll just clear results when filters change
      setResults([]);
    }
  }, [filters]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading search index...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">OSINT Semantic Search</h1>
          <p className="text-gray-600 mt-1">
            Search {allMetadata.length.toLocaleString()} world events from multiple intelligence sources
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            isLoading={isSearching}
            resultCount={results.length}
          />
        </div>

        {/* Filters and Results */}
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <aside className="flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              allMetadata={allMetadata}
            />
          </aside>

          {/* Results */}
          <div className="flex-1">
            <ResultsList results={results} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            Powered by OpenAI embeddings and client-side semantic search
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
