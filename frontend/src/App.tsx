import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useTransition,
} from 'react';
import { CommandBar } from './components/CommandBar';
import { FilterRail } from './components/FilterRail';
import { ResultsPane } from './components/ResultsPane';
import { MapView } from './components/MapView';
import { EventDetail } from './components/EventDetail';
import { StatusBar } from './components/StatusBar';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import { IndexLoader } from './lib/IndexLoader';
import { SearchEngine } from './lib/SearchEngine';
import { useSavedSearches } from './hooks/useSavedSearches';
import { copyToClipboard } from './lib/utils';
import type {
  SearchResult,
  SearchFilters,
  EventMetadata,
  EventDetail as EventDetailType,
  IndexSchema,
  SavedSearch,
  SortEntry,
  SortField,
  SortDirection,
} from './types';

// ── URL state helpers ─────────────────────────────────────────
function getUrlParams(): { query: string; filters: SearchFilters } {
  const p = new URLSearchParams(window.location.search);
  return {
    query: p.get('q') ?? '',
    filters: {
      dateFrom: p.get('from'),
      dateTo: p.get('to'),
      country: p.get('country'),
      topics: p.get('topics')?.split(',').filter(Boolean) ?? [],
      minConfidence: parseFloat(p.get('conf') ?? '0') / 100,
    },
  };
}

function syncUrl(query: string, filters: SearchFilters) {
  const p = new URLSearchParams();
  if (query) p.set('q', query);
  if (filters.dateFrom) p.set('from', filters.dateFrom);
  if (filters.dateTo) p.set('to', filters.dateTo);
  if (filters.country) p.set('country', filters.country);
  if (filters.topics.length) p.set('topics', filters.topics.join(','));
  if (filters.minConfidence > 0) p.set('conf', String(Math.round(filters.minConfidence * 100)));
  const qs = p.toString();
  window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
}

// ── Singletons (survive React strict-mode remounts) ───────────
const loader = new IndexLoader();
const engine = new SearchEngine();

type RightPane = 'map' | 'detail';

const DEFAULT_FILTERS: SearchFilters = {
  dateFrom: null,
  dateTo: null,
  country: null,
  topics: [],
  minConfidence: 0,
};

function applySort(results: SearchResult[], sorts: SortEntry[]): SearchResult[] {
  if (!sorts.length) return results;
  return [...results].sort((a, b) => {
    for (const s of sorts) {
      let cmp = 0;
      if (s.field === 'date') {
        cmp = (a.date_published ?? '').localeCompare(b.date_published ?? '');
      } else if (s.field === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (s.field === 'confidence') {
        cmp = (a.confidence ?? 0) - (b.confidence ?? 0);
      }
      if (cmp !== 0) return s.dir === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

function toggleSort(sorts: SortEntry[], field: SortField, dir: SortDirection): SortEntry[] {
  const existing = sorts.find(s => s.field === field && s.dir === dir);
  if (existing) {
    // already active → remove
    return sorts.filter(s => !(s.field === field && s.dir === dir));
  }
  // remove any existing entry for this field, then append new
  return [...sorts.filter(s => s.field !== field), { field, dir }];
}

function App() {
  const initial = useMemo(getUrlParams, []);

  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allMetadata, setAllMetadata] = useState<EventMetadata[]>([]);
  const [schema, setSchema] = useState<IndexSchema | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [query, setQuery] = useState(initial.query);
  const [filters, setFilters] = useState<SearchFilters>(initial.filters);
  const [debouncedQuery, setDebouncedQuery] = useState(initial.query);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightPane, setRightPane] = useState<RightPane>('map');
  const [showHelp, setShowHelp] = useState(false);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sorts, setSorts] = useState<SortEntry[]>([]);
  const [, startTransition] = useTransition();

  const [eventDetail, setEventDetail] = useState<EventDetailType | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { searches: savedSearches, save: saveSearch, remove: removeSaved } = useSavedSearches();

  const showToast = useCallback((msg: string, ms = 2000) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), ms);
  }, []);

  // Initialize index
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sch, meta] = await Promise.all([
          loader.loadSchema(),
          loader.loadMetadata(),
        ]);
        if (cancelled) return;
        await engine.initialize(meta);
        setSchema(sch);
        setAllMetadata(meta);
        setIsInitializing(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load index');
          setIsInitializing(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Real-time search via useTransition (no debounce needed — pure sync)
  useEffect(() => {
    if (isInitializing) return;
    setDebouncedQuery(query); // keep debouncedQuery in sync for display logic
    setIsSearching(true);
    startTransition(() => {
      const res = engine.searchSync(query, filters);
      setResults(res);
      if (res.length > 0 && !selectedId) setSelectedId(res[0].id);
      setIsSearching(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters, isInitializing]);

  // Sync URL
  useEffect(() => { syncUrl(query, filters); }, [query, filters]);

  // Load event detail
  useEffect(() => {
    if (!selectedId) { setEventDetail(null); return; }
    let cancelled = false;
    setEventDetail(null);
    setIsLoadingDetail(true);
    loader.loadEventDetail(selectedId)
      .then(d => { if (!cancelled) setEventDetail(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoadingDetail(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as Element)?.tagName ?? '';
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);

      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowHelp(s => !s);
        return;
      }
      if (e.key === 'Escape') {
        if (showHelp) { setShowHelp(false); return; }
        if (rightPane === 'detail') { setRightPane('map'); return; }
        if (isInput) { (e.target as HTMLElement).blur(); return; }
        if (query) { setQuery(''); return; }
        return;
      }
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (!isInput) {
        if (e.key === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedId(prev => {
            const idx = results.findIndex(r => r.id === prev);
            return results[Math.min(idx + 1, results.length - 1)]?.id ?? prev;
          });
        } else if (e.key === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedId(prev => {
            const idx = results.findIndex(r => r.id === prev);
            return results[Math.max(idx - 1, 0)]?.id ?? prev;
          });
        } else if (e.key === 'Enter' && selectedId) {
          setRightPane('detail');
        } else if (e.key === 'm' || e.key === 'M') {
          setRightPane(p => p === 'map' ? 'detail' : 'map');
        } else if ((e.key === 'c' || e.key === 'C') && selectedId) {
          const ev = results.find(r => r.id === selectedId);
          if (ev) { copyToClipboard(JSON.stringify(ev, null, 2)); showToast('Copied JSON'); }
        } else if (e.key === 's' || e.key === 'S') {
          saveSearch(query, filters); showToast('Search saved');
        } else if (e.key === 'f' || e.key === 'F') {
          setFilterCollapsed(p => !p);
        } else if (e.key === 'r' || e.key === 'R') {
          setQuery(''); setFilters(DEFAULT_FILTERS); setSorts([]);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [results, selectedId, showHelp, rightPane, query, filters, saveSearch, showToast]);

  // Derived
  const sortedResults = useMemo(() => applySort(results, sorts), [results, sorts]);
  const selectedIndex = useMemo(
    () => sortedResults.findIndex(r => r.id === selectedId),
    [sortedResults, selectedId]
  );
  const selectedMetadata = useMemo(
    () => sortedResults.find(r => r.id === selectedId) ?? null,
    [sortedResults, selectedId]
  );
  const filtersActive =
    filters.dateFrom !== null || filters.dateTo !== null ||
    filters.country !== null || filters.topics.length > 0 || filters.minConfidence > 0;

  const handleLoadSaved = useCallback((s: SavedSearch) => {
    setQuery(s.query); setFilters(s.filters);
  }, []);
  const handleSelect = useCallback((id: string) => setSelectedId(id), []);
  const handleOpen = useCallback((id: string) => {
    setSelectedId(id); setRightPane('detail');
  }, []);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-term-bg font-mono text-[9px] gap-3">
        <span className="text-term-red text-[11px]">✗ LOAD ERROR</span>
        <span className="text-term-secondary">{error}</span>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 border border-term-border text-term-secondary hover:text-term-green hover:border-term-green transition-colors"
        >
          RELOAD
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-term-bg font-mono text-[9px] text-term-primary overflow-hidden scanlines">
      <CommandBar
        query={query}
        onQueryChange={setQuery}
        isLoading={isInitializing || isSearching}
        eventCount={allMetadata.length}
        resultCount={results.length}
        lastUpdated={schema?.last_updated ?? null}
        savedSearches={savedSearches}
        onLoadSaved={handleLoadSaved}
        onRemoveSaved={removeSaved}
        onToggleHelp={() => setShowHelp(s => !s)}
        onToggleFilters={() => setFilterCollapsed(s => !s)}
        filtersActive={filtersActive}
        searchInputRef={searchInputRef}
      />

      {isInitializing && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-term-bg gap-3">
          <span className="text-term-green text-[14px] animate-pulse-green">⟳</span>
          <span className="text-[9px] text-term-secondary">INITIALIZING INDEX…</span>
        </div>
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <FilterRail
          filters={filters}
          onFiltersChange={setFilters}
          allMetadata={allMetadata}
          collapsed={filterCollapsed}
        />

        <ResultsPane
          results={sortedResults}
          selectedId={selectedId}
          isSearching={isSearching}
          query={debouncedQuery}
          sorts={sorts}
          onSortChange={(field, dir) => setSorts(prev => toggleSort(prev, field, dir))}
          onClearSorts={() => setSorts([])}
          onSelect={handleSelect}
          onOpen={handleOpen}
        />

        <div className="w-[420px] flex-shrink-0 flex flex-col min-h-0">
          {rightPane === 'map' ? (
            <MapView
              results={results}
              selectedId={selectedId}
              onSelectEvent={handleSelect}
              onOpenEvent={handleOpen}
            />
          ) : (
            <EventDetail
              metadata={selectedMetadata}
              detail={eventDetail}
              isLoading={isLoadingDetail}
              onClose={() => setRightPane('map')}
              onShowMap={() => setRightPane('map')}
            />
          )}
        </div>
      </div>

      <StatusBar
        isReady={!isInitializing && !error}
        isSearching={isSearching}
        eventCount={allMetadata.length}
        resultCount={sortedResults.length}
        selectedIndex={selectedIndex}
        lastUpdated={schema?.last_updated ?? null}
        toast={toast}
      />

      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
