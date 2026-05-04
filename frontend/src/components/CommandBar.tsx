import React, { useRef, useState } from 'react';
import type { SavedSearch } from '../types';
import { formatDateCompact } from '../lib/utils';

interface CommandBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  isLoading: boolean;
  eventCount: number;
  resultCount: number;
  lastUpdated: string | null;
  savedSearches: SavedSearch[];
  onLoadSaved: (s: SavedSearch) => void;
  onRemoveSaved: (id: string) => void;
  onToggleHelp: () => void;
  onToggleFilters: () => void;
  filtersActive: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  query,
  onQueryChange,
  isLoading,
  eventCount,
  resultCount,
  lastUpdated,
  savedSearches,
  onLoadSaved,
  onRemoveSaved,
  onToggleHelp,
  onToggleFilters,
  filtersActive,
  searchInputRef,
}) => {
  const [showSaved, setShowSaved] = useState(false);
  const savedRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="relative flex items-center h-7 px-2 border-b border-term-border bg-term-surface flex-shrink-0 gap-2">
      {/* Logo */}
      <span className="text-term-green font-mono font-bold text-[10px] flex-shrink-0 tracking-tight select-none">
        OSINT<span className="text-term-dim">//</span>
      </span>

      {/* Divider */}
      <span className="text-term-border flex-shrink-0">│</span>

      {/* Search input */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {isLoading ? (
          <span className="text-term-yellow text-[9px] flex-shrink-0 animate-pulse-green">⟳</span>
        ) : (
          <span className="text-term-dim text-[9px] flex-shrink-0">▶</span>
        )}
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="search events... (press / to focus)"
          className="flex-1 min-w-0 bg-transparent text-[9px] text-term-primary placeholder:text-term-dim caret-term-green focus:outline-none"
          spellCheck={false}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="text-term-dim hover:text-term-red text-[9px] flex-shrink-0 transition-colors"
            tabIndex={-1}
          >
            ✕
          </button>
        )}
      </div>

      {/* Divider */}
      <span className="text-term-border flex-shrink-0">│</span>

      {/* Stats */}
      <span className="text-[8px] text-term-secondary flex-shrink-0 tabular-nums">
        {resultCount.toLocaleString()}<span className="text-term-dim">/{eventCount.toLocaleString()}</span>
      </span>

      {lastUpdated && (
        <span className="text-[8px] text-term-dim flex-shrink-0 hidden md:block">
          {formatDateCompact(lastUpdated).slice(0, 10)}
        </span>
      )}

      {/* Divider */}
      <span className="text-term-border flex-shrink-0">│</span>

      {/* Filter toggle */}
      <button
        onClick={onToggleFilters}
        title="Toggle filters [F]"
        className={`text-[8px] px-1.5 py-0.5 border transition-colors flex-shrink-0 ${
          filtersActive
            ? 'border-term-green text-term-green'
            : 'border-term-border text-term-secondary hover:text-term-primary hover:border-term-border-hi'
        }`}
      >
        FILTER
      </button>

      {/* Saved searches */}
      <div ref={savedRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowSaved(s => !s)}
          title="Saved searches [S]"
          className={`text-[8px] px-1.5 py-0.5 border transition-colors ${
            showSaved
              ? 'border-term-cyan text-term-cyan'
              : 'border-term-border text-term-secondary hover:text-term-primary hover:border-term-border-hi'
          }`}
        >
          ☆ {savedSearches.length > 0 ? savedSearches.length : ''}
        </button>

        {showSaved && (
          <div className="absolute right-0 top-full mt-px w-72 bg-term-surface border border-term-border-hi z-40 animate-fade-in">
            <div className="px-2 py-1 border-b border-term-border flex items-center justify-between">
              <span className="text-[8px] text-term-secondary">SAVED SEARCHES</span>
              <button
                onClick={() => setShowSaved(false)}
                className="text-[8px] text-term-dim hover:text-term-primary transition-colors"
              >
                ✕
              </button>
            </div>
            {savedSearches.length === 0 ? (
              <div className="px-2 py-3 text-[8px] text-term-dim text-center">
                No saved searches. Press S to save.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {savedSearches.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 px-2 py-1.5 border-b border-term-border hover:bg-term-panel cursor-pointer group transition-colors"
                  >
                    <button
                      className="flex-1 text-left min-w-0"
                      onClick={() => { onLoadSaved(s); setShowSaved(false); }}
                    >
                      <div className="text-[9px] text-term-primary truncate">{s.label}</div>
                      <div className="text-[7px] text-term-dim">
                        {formatDateCompact(s.savedAt).slice(0, 10)}
                      </div>
                    </button>
                    <button
                      onClick={() => onRemoveSaved(s.id)}
                      className="text-term-dim hover:text-term-red text-[9px] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help */}
      <button
        onClick={onToggleHelp}
        title="Keyboard shortcuts [?]"
        className="text-[8px] text-term-secondary hover:text-term-primary transition-colors flex-shrink-0 px-1"
      >
        ?
      </button>
    </div>
  );
};
