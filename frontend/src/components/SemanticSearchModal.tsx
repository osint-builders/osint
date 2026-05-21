import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import gsap from 'gsap';
import type { EventMetadata } from '../types';
import { highlightMatches, tokenizeQuery } from '../lib/highlightMatches';
import { formatDateShort, truncate, getSourceIcon, getTagColor } from '../lib/utils';

export interface SemanticHit {
  metadata: EventMetadata;
  score: number;
}

interface SemanticSearchModalProps {
  results: SemanticHit[];
  query: string;
  onQueryChange: (q: string) => void;
  visible: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const ROW_HEIGHT = 62;

export const SemanticSearchModal: React.FC<SemanticSearchModalProps> = ({
  results,
  query,
  onQueryChange,
  visible,
  onClose,
  onSelect,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
  });

  useEffect(() => { setActiveIndex(0); }, [results]);
  useEffect(() => {
    if (visible) requestAnimationFrame(() => inputRef.current?.focus());
  }, [visible]);

  useEffect(() => {
    if (!visible || !backdropRef.current || !panelRef.current) return;
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'power2.out' });
    gsap.fromTo(panelRef.current, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power3.out', delay: 0.02 });
  }, [visible]);

  useEffect(() => {
    if (results.length > 0) virtualizer.scrollToIndex(activeIndex, { align: 'auto' });
  }, [activeIndex, virtualizer, results.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return;
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        if (results.length > 0) setActiveIndex(i => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        if (results.length > 0) setActiveIndex(i => (i - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        onSelect(results[activeIndex].metadata.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [visible, results, activeIndex, onSelect, onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  if (!visible) return null;

  const tokens = tokenizeQuery(query);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex justify-center"
      style={{ paddingTop: '2rem' }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/80" />

      <div
        ref={panelRef}
        className="relative w-full max-w-2xl mx-4 flex flex-col bg-term-bg border border-term-border-hi"
        style={{ maxHeight: 'calc(100vh - 4rem)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-term-border bg-term-bg">
          <span className="text-term-green text-[8px]">▶</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="search events..."
            className="flex-1 bg-transparent text-[9px] text-term-primary placeholder:text-term-dim caret-term-green focus:outline-none"
            spellCheck={false}
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="text-term-dim hover:text-term-red text-[8px] transition-colors"
              tabIndex={-1}
            >
              ✕
            </button>
          )}
          {results.length > 0 && (
            <span className="text-[7px] text-term-dim tabular-nums">{results.length}</span>
          )}
        </div>

        {/* Result list */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
        >
          {results.length === 0 && query.trim().length >= 2 && (
            <div className="px-3 py-6 text-center text-[8px] text-term-dim">
              No matches found.
            </div>
          )}
          {results.length === 0 && query.trim().length < 2 && (
            <div className="px-3 py-6 text-center text-[8px] text-term-dim">
              Type at least 2 characters to search.
            </div>
          )}
          {results.length > 0 && (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((vRow) => {
                const i = vRow.index;
                const hit = results[i];
                const isActive = i === activeIndex;
                const m = hit.metadata;
                const date = formatDateShort(m.date_event ?? m.date_published);
                const srcIcon = getSourceIcon(m.source_name);
                const confPct = m.confidence !== null ? Math.round(m.confidence * 100) : null;
                const geoStr = [m.geo?.city, m.geo?.country].filter(Boolean).join(', ');

                return (
                  <div
                    key={m.id}
                    data-index={i}
                    ref={virtualizer.measureElement}
                    className={[
                      'absolute left-0 right-0 flex flex-col gap-px px-3 py-1.5 cursor-pointer border-l-2 transition-colors duration-75',
                      isActive
                        ? 'border-term-green bg-term-green-dim'
                        : 'border-transparent hover:border-term-border-hi hover:bg-term-panel',
                    ].join(' ')}
                    style={{ top: vRow.start }}
                    onClick={() => onSelect(m.id)}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    {/* Line 1: meta */}
                    <div className="flex items-center gap-1.5 text-[7px] leading-tight min-w-0">
                      <span
                        className="flex-shrink-0 font-bold text-[7px] px-0.5 leading-none"
                        style={{ color: srcIcon.color }}
                      >
                        {srcIcon.symbol}
                      </span>
                      <span className={isActive ? 'text-[#c0c0c0]' : 'text-term-secondary'}>{date}</span>
                      {geoStr && <span>·</span>}
                      {geoStr && (
                        <span className={`truncate max-w-[80px] ${isActive ? 'text-[#a0a0a0]' : 'text-term-dim'}`}>
                          {geoStr}
                        </span>
                      )}
                      <span className={isActive ? 'text-[#a0a0a0]' : 'text-term-dim'}>·</span>
                      <span className={`truncate min-w-0 ${isActive ? 'text-[#a0a0a0]' : 'text-term-dim'}`}>
                        {m.source_name}
                      </span>
                      <span className="ml-auto text-term-green flex-shrink-0 text-[7px]">
                        {Math.round(hit.score * 100)}%
                      </span>
                    </div>

                    {/* Line 2: title */}
                    <div className={[
                      'text-[10px] font-medium leading-tight truncate',
                      isActive ? 'text-term-green' : 'text-term-primary',
                    ].join(' ')}>
                      {highlightMatches(m.title, tokens)}
                    </div>

                    {/* Line 3: summary */}
                    <div className={`text-[8px] leading-tight truncate ${isActive ? 'text-[#b0b0b0]' : 'text-term-secondary'}`}>
                      {truncate(m.summary, 120)}
                    </div>

                    {/* Line 4: topics + confidence */}
                    <div className="flex items-center gap-1 mt-px min-w-0">
                      {[...m.topics].sort().slice(0, 4).map(t => (
                        <span
                          key={t}
                          className="text-[7px] px-1 border leading-tight flex-shrink-0 truncate max-w-[60px]"
                          style={{ borderColor: getTagColor(t), color: getTagColor(t) }}
                        >
                          {t}
                        </span>
                      ))}
                      {m.topics.length > 4 && (
                        <span className="text-[7px] text-term-muted">+{m.topics.length - 4}</span>
                      )}
                      {confPct !== null && (
                        <span className="ml-auto flex items-center gap-1 flex-shrink-0">
                          <span className="relative inline-block w-10 h-[2px] bg-term-border">
                            <span
                              className="absolute left-0 top-0 h-full bg-term-green"
                              style={{ width: `${confPct}%` }}
                            />
                          </span>
                          <span className="text-[7px] text-term-dim w-5 text-right">{confPct}%</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-term-border bg-term-bg">
          <div className="flex items-center gap-3 text-[7px] text-term-dim select-none">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
          <span className="text-[6px] text-term-dim tracking-widest uppercase select-none">
            vector search
          </span>
        </div>
      </div>
    </div>
  );
};
