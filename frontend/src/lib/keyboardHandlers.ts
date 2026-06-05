import type { SearchFilters, SearchResult } from '../types';

function isInputElement(e: KeyboardEvent): boolean {
  const tag = (e.target as Element)?.tagName ?? '';
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
}

interface KeyboardContext {
  results: SearchResult[];
  selectedId: string | null;
  showHelp: boolean;
  rightPane: string;
  query: string;
  filters: SearchFilters;
  setShowHelp: (value: boolean | ((prev: boolean) => boolean)) => void;
  setRightPane: (value: any | ((prev: any) => any)) => void;
  setQuery: (value: string) => void;
  setSelectedId: (value: string | null | ((prev: string | null) => string | null)) => void;
  setFilterCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  setFilters: (filters: SearchFilters) => void;
  setSorts: (sorts: any[]) => void;
  setView: (value: any | ((prev: any) => any)) => void;
  saveSearch: (query: string, filters: SearchFilters) => void;
  showToast: (message: string) => void;
  copyToClipboard: (text: string) => Promise<void>;
  getDefaultFilters: () => SearchFilters;
}

function handleEscapeKey(
  e: KeyboardEvent,
  ctx: Pick<KeyboardContext, 'showHelp' | 'rightPane' | 'query' | 'setShowHelp' | 'setRightPane' | 'setQuery'>
): void {
  const isInput = isInputElement(e);
  if (ctx.showHelp) { ctx.setShowHelp(false); return; }
  if (ctx.rightPane === 'detail') { ctx.setRightPane('map'); return; }
  if (isInput) { (e.target as HTMLElement).blur(); return; }
  if (ctx.query) { ctx.setQuery(''); return; }
}

function handleNavigationKey(
  e: KeyboardEvent,
  ctx: Pick<KeyboardContext, 'results' | 'selectedId' | 'setSelectedId' | 'setRightPane'>
): void {
  if (e.key === 'j' || e.key === 'ArrowDown') {
    e.preventDefault();
    ctx.setSelectedId(prev => {
      const idx = ctx.results.findIndex(r => r.id === prev);
      return ctx.results[Math.min(idx + 1, ctx.results.length - 1)]?.id ?? prev;
    });
  } else if (e.key === 'k' || e.key === 'ArrowUp') {
    e.preventDefault();
    ctx.setSelectedId(prev => {
      const idx = ctx.results.findIndex(r => r.id === prev);
      return ctx.results[Math.max(idx - 1, 0)]?.id ?? prev;
    });
  } else if (e.key === 'Enter' && ctx.selectedId) {
    ctx.setRightPane('detail');
  }
}

function handleActionKey(
  e: KeyboardEvent,
  ctx: Pick<KeyboardContext, 'results' | 'selectedId' | 'query' | 'filters' | 'setRightPane' | 'setFilterCollapsed' | 'setQuery' | 'setFilters' | 'setSorts' | 'setView' | 'saveSearch' | 'showToast' | 'copyToClipboard' | 'getDefaultFilters'>
): void {
  if (e.key === 'm' || e.key === 'M') {
    ctx.setRightPane((p: any) => p === 'map' ? 'detail' : 'map');
  } else if ((e.key === 'c' || e.key === 'C') && ctx.selectedId) {
    const ev = ctx.results.find(r => r.id === ctx.selectedId);
    if (ev) { ctx.copyToClipboard(JSON.stringify(ev, null, 2)); ctx.showToast('Copied JSON'); }
  } else if (e.key === 's' || e.key === 'S') {
    ctx.saveSearch(ctx.query, ctx.filters);
    ctx.showToast('Search saved');
  } else if (e.key === 'f' || e.key === 'F') {
    ctx.setFilterCollapsed(p => !p);
  } else if (e.key === 'r' || e.key === 'R') {
    ctx.setQuery('');
    ctx.setFilters(ctx.getDefaultFilters());
    ctx.setSorts([]);
  } else if (e.key === 't' || e.key === 'T') {
    ctx.setView((v: any) => v === 'search' ? 'timeline' : 'search');
  }
}

export function createKeyboardHandler(ctx: KeyboardContext, semanticModalVisible: boolean, setSemanticModalVisible: (visible: boolean) => void) {
  return (e: KeyboardEvent) => {
    if (semanticModalVisible) return;

    const isInput = isInputElement(e);

    if (e.key === '?' && !isInput) {
      e.preventDefault();
      ctx.setShowHelp(s => !s);
      return;
    }
    if (e.key === 'Escape') {
      handleEscapeKey(e, ctx);
      return;
    }
    if (e.key === '/' && !isInput) {
      e.preventDefault();
      setSemanticModalVisible(true);
      return;
    }
    if (!isInput) {
      handleNavigationKey(e, ctx);
      handleActionKey(e, ctx);
    }
  };
}
