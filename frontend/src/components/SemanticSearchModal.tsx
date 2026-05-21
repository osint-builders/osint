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

function scoreTier(pct: number): { label: string; cls: string } {
  if (pct >= 85) return { label: 'HIGH', cls: 'text-term-green border-term-green/40' };
  if (pct >= 60) return { label: 'MED', cls: 'text-term-yellow border-term-yellow/40' };
  return { label: 'LOW', cls: 'text-term-orange border-term-orange/40' };
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

  useEffect(() => { setActiveIndex(0); }, [results]);

  // Animate in
  useEffect(() => {
    if (!visible || !backdropRef.current || !panelRef.current) return;
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'power2.out' });
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: -10, scaleY: 0.96 },
      { opacity: 1, y: 0, scaleY: 1, duration: 0.2, ease: 'power3.out', delay: 0.02 },
    );
  }, [visible]);

  // Scroll active into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Keyboard — capture phase
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
      style={{ paddingTop: '2rem' }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Backdrop with vignette */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-2xl mx-4 flex flex-col bg-term-bg border border-term-green/20 shadow-2xl"
        style={{
          maxHeight: 'calc(100vh - 4rem)',
          boxShadow: '0 0 40px rgba(0,255,65,0.06), 0 0 2px rgba(0,255,65,0.15), inset 0 1px 0 rgba(0,255,65,0.05)',
        }}
      >
        {/* ── CRT scanlines inside panel ── */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)',
          }}
        />

        {/* ── Header bar ── */}
        <div className="relative z-20 flex items-center gap-2 px-3 py-1.5 border-b border-term-green/10 bg-term-surface">
          <span className="text-term-green text-[8px] animate-pulse-green">█</span>
          <span className="text-[8px] text-term-green/70 tracking-widest uppercase">
            SEMANTIC SEARCH
          </span>
          <span className="text-term-dim text-[8px]">—</span>
          <span className="text-[8px] text-term-secondary truncate flex-1">
            {query}
          </span>
          <span className="text-[7px] text-term-green/50 tabular-nums">
            [{results.length}]
          </span>
        </div>

        {/* ── Result list ── */}
        <div ref={listRef} className="relative z-20 flex-1 overflow-y-auto overscroll-contain">
          {results.map((hit, i) => {
            const isActive = i === activeIndex;
            const pct = Math.round(hit.score * 100);
            const tier = scoreTier(pct);
            const m = hit.metadata;
            const confPct = m.confidence !== null ? Math.round(m.confidence * 100) : null;

            return (
              <div
                key={m.id}
                className={`group relative flex gap-3 px-3 py-2.5 cursor-pointer transition-all duration-75 ${
                  isActive
                    ? 'bg-term-green/[0.04]'
                    : 'hover:bg-term-surface'
                }`}
                onClick={() => onSelect(m.id)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {/* Active indicator — terminal cursor bar */}
                <div
                  className={`absolute left-0 top-1 bottom-1 w-[2px] transition-all duration-75 ${
                    isActive ? 'bg-term-green' : 'bg-transparent'
                  }`}
                />

                {/* Rank column */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5 flex-shrink-0 w-5">
                  <span className={`text-[8px] tabular-nums font-bold ${
                    isActive ? 'text-term-green' : 'text-term-dim'
                  }`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className={`text-[10px] leading-snug font-medium ${
                    isActive ? 'text-term-primary' : 'text-term-secondary'
                  }`}>
                    {highlightMatches(m.title, tokens)}
                  </div>

                  {/* Summary — 2 lines max */}
                  <div className="text-[8px] text-term-dim leading-relaxed mt-0.5 line-clamp-2">
                    {highlightMatches(m.summary, tokens)}
                  </div>

                  {/* Metadata row */}
                  <div className="flex items-center gap-2 mt-1.5 text-[7px]">
                    <span className="text-term-green/60">
                      {formatDateCompact(m.date_event ?? m.date_published)}
                    </span>
                    <span className="text-term-border">│</span>
                    <span className="text-term-dim truncate max-w-[120px]">
                      {m.source_name}
                    </span>
                    {confPct !== null && (
                      <>
                        <span className="text-term-border">│</span>
                        <span className="flex items-center gap-1">
                          <span className="relative inline-block w-6 h-[2px] bg-term-dim">
                            <span
                              className="absolute left-0 top-0 h-full bg-term-green/50"
                              style={{ width: `${confPct}%` }}
                            />
                          </span>
                          <span className="text-term-dim tabular-nums">{confPct}%</span>
                        </span>
                      </>
                    )}
                    {m.topics.length > 0 && (
                      <>
                        <span className="text-term-border">│</span>
                        {m.topics.slice(0, 3).map(t => (
                          <span
                            key={t}
                            className="text-[6px] px-1 py-px border border-term-border text-term-dim uppercase tracking-wider"
                          >
                            {t}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Score column */}
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0 pt-0.5">
                  <span className={`text-[8px] font-bold tabular-nums border px-1 py-px ${tier.cls}`}>
                    {pct}%
                  </span>
                  <span className={`text-[6px] tracking-widest ${tier.cls}`}>
                    {tier.label}
                  </span>
                </div>

                {/* Bottom separator */}
                <div className="absolute bottom-0 left-3 right-3 h-px bg-term-border/40" />
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="relative z-20 flex items-center justify-between px-3 py-1 border-t border-term-green/10 bg-term-surface">
          <div className="flex items-center gap-3 text-[7px] text-term-dim select-none">
            <span><span className="text-term-green/40">↑↓</span> navigate</span>
            <span><span className="text-term-green/40">↵</span> open</span>
            <span><span className="text-term-green/40">esc</span> close</span>
          </div>
          <span className="text-[6px] text-term-dim tracking-widest uppercase select-none">
            vector search
          </span>
        </div>
      </div>
    </div>
  );
};
