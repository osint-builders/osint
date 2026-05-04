import React, { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { SearchResult, SortEntry, SortField, SortDirection } from '../types';
import { EventRow } from './EventRow';

// Each EventRow: px-3 py-2 + 4 lines ≈ 68px
const ROW_HEIGHT = 68;

interface ResultsPaneProps {
  results: SearchResult[];
  selectedId: string | null;
  isSearching: boolean;
  query: string;
  sorts: SortEntry[];
  onSortChange: (field: SortField, dir: SortDirection) => void;
  onClearSorts: () => void;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

// Compact sort toggle button
const SortBtn: React.FC<{
  label: string; field: SortField; dir: SortDirection;
  active: boolean; onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`text-[7px] px-1 py-px border transition-colors ${
      active
        ? 'border-term-cyan text-term-cyan'
        : 'border-term-border text-term-dim hover:text-term-secondary hover:border-term-border-hi'
    }`}
  >
    {label}
  </button>
);

export const ResultsPane: React.FC<ResultsPaneProps> = ({
  results,
  selectedId,
  isSearching,
  query,
  sorts,
  onSortChange,
  onClearSorts,
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
      {/* Sort + column header */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-term-bg border-b border-term-border">
        <span className="text-[7px] text-term-dim tracking-widest flex-1">SORT:</span>
        <SortBtn label="DATE↓" field="date" dir="desc" active={sorts.some(s => s.field==='date'&&s.dir==='desc')} onClick={() => onSortChange('date','desc')} />
        <SortBtn label="DATE↑" field="date" dir="asc"  active={sorts.some(s => s.field==='date'&&s.dir==='asc')}  onClick={() => onSortChange('date','asc')}  />
        <SortBtn label="CONF↓" field="confidence" dir="desc" active={sorts.some(s => s.field==='confidence'&&s.dir==='desc')} onClick={() => onSortChange('confidence','desc')} />
        <SortBtn label="CONF↑" field="confidence" dir="asc"  active={sorts.some(s => s.field==='confidence'&&s.dir==='asc')}  onClick={() => onSortChange('confidence','asc')}  />
        <SortBtn label="A→Z"   field="title" dir="asc"  active={sorts.some(s => s.field==='title'&&s.dir==='asc')}  onClick={() => onSortChange('title','asc')}  />
        <SortBtn label="Z→A"   field="title" dir="desc" active={sorts.some(s => s.field==='title'&&s.dir==='desc')} onClick={() => onSortChange('title','desc')} />
        {sorts.length > 0 && (
          <button onClick={onClearSorts} className="text-[7px] text-term-red hover:text-term-primary ml-0.5 transition-colors" title="Clear sorts">×</button>
        )}
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
