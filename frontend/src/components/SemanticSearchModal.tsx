import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import type { EventMetadata } from '../types';
import { highlightMatches, tokenizeQuery } from '../lib/highlightMatches';
import { formatDateCompact } from '../lib/utils';

export interface SemanticHit {
  metadata: EventMetadata;
  score: number;
}

interface SemanticSearchModalProps {
  results: SemanticHit[];
  query: string;
  visible: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

function scoreColor(pct: number): string {
  if (pct >= 85) return 'text-term-green bg-term-green/10';
  if (pct >= 60) return 'text-term-yellow bg-term-yellow/10';
  return 'text-term-orange bg-term-orange/10';
}

export const SemanticSearchModal: React.FC<SemanticSearchModalProps> = ({
  results,
  query,
  visible,
  onClose,
  onSelect,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset active index when results change
  useEffect(() => { setActiveIndex(0); }, [results]);

  // Animate in
  useEffect(() => {
    if (!visible || !backdropRef.current || !panelRef.current) return;
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: 'power2.out' });
    gsap.fromTo(panelRef.current, { opacity: 0, y: -8, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: 'power2.out', delay: 0.03 });
  }, [visible]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Keyboard: arrows, enter, escape — capture phase to intercept before App
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible || results.length === 0) return;

      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setActiveIndex(i => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setActiveIndex(i => (i - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
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

  if (!visible || results.length === 0) return null;

  const tokens = tokenizeQuery(query);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex justify-center"
      style={{ paddingTop: '2.5rem' }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50" />

      {/* Palette panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-lg mx-4 flex flex-col border border-term-border-hi bg-term-surface shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 5rem)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-term-border">
          <span className="text-term-cyan text-[8px]">◆</span>
          <span className="text-[8px] text-term-secondary flex-1 truncate">
            Semantic results for &ldquo;<span className="text-term-primary">{query}</span>&rdquo;
          </span>
          <span className="text-[7px] text-term-dim tabular-nums">
            {results.length} match{results.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* Result list */}
        <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain">
          {results.map((hit, i) => {
            const isActive = i === activeIndex;
            const pct = Math.round(hit.score * 100);
            const m = hit.metadata;
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2 px-3 py-2 cursor-pointer border-b border-term-border/50 transition-colors ${
                  isActive ? 'bg-term-panel' : 'hover:bg-term-panel/50'
                }`}
                onClick={() => onSelect(m.id)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {/* Rank */}
                <span className="text-[7px] text-term-dim tabular-nums w-3 flex-shrink-0 pt-px text-right">
                  {i + 1}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-term-primary leading-snug truncate">
                    {highlightMatches(m.title, tokens)}
                  </div>
                  <div className="text-[8px] text-term-dim leading-snug mt-0.5 line-clamp-2">
                    {highlightMatches(m.summary, tokens)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[7px] text-term-dim">
                    <span>{formatDateCompact(m.date_event ?? m.date_published)}</span>
                    <span className="text-term-border">·</span>
                    <span className="truncate max-w-[100px]">{m.source_name}</span>
                    {m.topics.length > 0 && (
                      <>
                        <span className="text-term-border">·</span>
                        <span className="truncate max-w-[120px]">
                          {m.topics.slice(0, 2).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score badge */}
                <span className={`text-[7px] font-bold px-1 py-px rounded-sm flex-shrink-0 tabular-nums ${scoreColor(pct)}`}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-center gap-3 px-3 py-1 border-t border-term-border text-[7px] text-term-dim select-none">
          <span>↑↓ navigate</span>
          <span className="text-term-border">·</span>
          <span>↵ open</span>
          <span className="text-term-border">·</span>
          <span>esc dismiss</span>
        </div>
      </div>
    </div>
  );
};
