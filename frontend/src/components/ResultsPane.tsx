import React, { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { SearchResult } from '../types';
import { EventRow } from './EventRow';

// Each EventRow: px-3 py-2 + 4 lines ≈ 68px
const ROW_HEIGHT = 68;

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const showScore = query.trim().length > 0;

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // Scroll selected row into view via virtualizer
  useEffect(() => {
    if (!selectedId) return;
    const idx = results.findIndex(r => r.id === selectedId);
    if (idx >= 0) virtualizer.scrollToIndex(idx, { behavior: 'smooth', align: 'auto' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

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
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {/* Sticky column header */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-term-bg border-b border-term-border text-[7px] text-term-dim tracking-widest">
        <span className="w-32 flex-shrink-0">DATE · GEO · SOURCE</span>
        <span className="flex-1">TITLE / SUMMARY</span>
        <span className="flex-shrink-0">CONF</span>
      </div>

      {/* Virtual scroll container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(vRow => (
            <div
              key={vRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${vRow.size}px`,
                transform: `translateY(${vRow.start}px)`,
              }}
            >
              <EventRow
                result={results[vRow.index]}
                index={vRow.index}
                isSelected={results[vRow.index].id === selectedId}
                showScore={showScore}
                onSelect={onSelect}
                onOpen={onOpen}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
