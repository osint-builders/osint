import React, { useEffect, useRef } from 'react';
import type { SearchResult } from '../types';
import { EventRow } from './EventRow';

interface ResultsPaneProps {
  results: SearchResult[];
  selectedId: string | null;
  isSearching: boolean;
  query: string;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

export const ResultsPane: React.FC<ResultsPaneProps> = ({
  results,
  selectedId,
  isSearching,
  query,
  onSelect,
  onOpen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const showScore = query.trim().length > 0;

  // Scroll selected row into view
  useEffect(() => {
    if (!selectedId || !containerRef.current) return;
    const idx = results.findIndex(r => r.id === selectedId);
    if (idx < 0) return;
    const row = containerRef.current.querySelectorAll('[data-index]')[idx] as HTMLElement | null;
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId, results]);

  if (isSearching) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[8px] text-term-dim gap-2">
        <span className="text-term-green text-[10px] animate-pulse-green">⟳</span>
        <span>SEARCHING…</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[8px] text-term-dim gap-2">
        <span className="text-[16px] text-term-muted">○</span>
        <span>{query ? 'NO RESULTS' : 'NO EVENTS'}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto min-w-0"
    >
      {/* Column header */}
      <div className="sticky top-0 z-10 flex items-center gap-1.5 px-3 py-1 bg-term-bg border-b border-term-border text-[7px] text-term-dim tracking-widest">
        <span className="w-32 flex-shrink-0">DATE · GEO · SOURCE</span>
        <span className="flex-1">TITLE / SUMMARY</span>
        <span className="flex-shrink-0">CONF</span>
      </div>

      {results.map((r, i) => (
        <EventRow
          key={r.id}
          result={r}
          index={i}
          isSelected={r.id === selectedId}
          showScore={showScore}
          onSelect={onSelect}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
};
