import { useState, useCallback } from 'react';
import type { SavedSearch, SearchFilters } from '../types';

const STORAGE_KEY = 'osint-saved-searches';
const MAX_SAVED = 20;

function load(): SavedSearch[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function persist(searches: SavedSearch[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>(load);

  const save = useCallback((query: string, filters: SearchFilters): SavedSearch => {
    const entry: SavedSearch = {
      id: Date.now().toString(),
      label: query.slice(0, 50) || '(all events)',
      query,
      filters,
      savedAt: new Date().toISOString(),
    };
    setSearches(prev => {
      const updated = [entry, ...prev.filter(s => s.query !== query)].slice(0, MAX_SAVED);
      persist(updated);
      return updated;
    });
    return entry;
  }, []);

  const remove = useCallback((id: string) => {
    setSearches(prev => {
      const updated = prev.filter(s => s.id !== id);
      persist(updated);
      return updated;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSearches([]);
  }, []);

  return { searches, save, remove, clear };
}
