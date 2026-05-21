import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import type { EventMetadata } from '../types';
import { highlightMatches, tokenizeQuery } from '../lib/highlightMatches';
import { formatDateCompact } from '../lib/utils';

interface SemanticSearchModalProps {
  result: EventMetadata | null;
  query: string;
  score: number;
  visible: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export const SemanticSearchModal: React.FC<SemanticSearchModalProps> = ({
  result,
  query,
  score,
  visible,
  onClose,
  onSelect,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Animate in/out
  useEffect(() => {
    if (!backdropRef.current || !cardRef.current) return;
    if (visible && result) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: 'power2.out' },
      );
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out', delay: 0.04 },
      );
    }
  }, [visible, result]);

  // Keyboard: Escape to close, Enter to select
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible || !result) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(result.id);
      }
    },
    [visible, result, onClose, onSelect],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!visible || !result) return null;

  const tokens = tokenizeQuery(query);
  const scorePct = Math.round(score * 100);
  const confPct =
    result.confidence !== null ? Math.round(result.confidence * 100) : null;

  const scoreColor =
    scorePct >= 85
      ? 'text-term-green border-term-green/40 bg-term-green/10'
      : scorePct >= 60
        ? 'text-term-yellow border-term-yellow/40 bg-term-yellow/10'
        : 'text-term-orange border-term-orange/40 bg-term-orange/10';

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex justify-center"
      style={{ paddingTop: '3rem' }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-md mx-4 h-fit border border-term-border-hi bg-term-surface shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 6rem)' }}
      >
        {/* Score badge — top-right */}
        <div
          className={`absolute -top-2 -right-2 text-[8px] font-bold px-1.5 py-0.5 border rounded-full ${scoreColor}`}
        >
          {scorePct}% match
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          {/* Title */}
          <h2 className="text-[11px] font-semibold text-term-primary leading-snug pr-12">
            {highlightMatches(result.title, tokens)}
          </h2>

          {/* Summary */}
          <p className="text-[9px] text-term-secondary leading-relaxed">
            {highlightMatches(result.summary, tokens)}
          </p>

          {/* Metadata row */}
          <div className="flex items-center gap-2 text-[8px] text-term-dim">
            <span className="text-term-secondary">
              {formatDateCompact(result.date_event ?? result.date_published)}
            </span>
            <span>·</span>
            <span className="text-term-secondary truncate max-w-[120px]">
              {result.source_name}
            </span>
            {confPct !== null && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span className="relative inline-block w-8 h-[2px] bg-term-border">
                    <span
                      className="absolute left-0 top-0 h-full bg-term-green"
                      style={{ width: `${confPct}%` }}
                    />
                  </span>
                  <span className="text-term-dim">{confPct}%</span>
                </span>
              </>
            )}
          </div>

          {/* Topics */}
          {result.topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.topics.map((t) => (
                <span
                  key={t}
                  className="text-[7px] px-1 py-px border border-term-border text-term-secondary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Link preview image */}
          {result.link_preview_image && (
            <div className="mt-1 overflow-hidden border border-term-border">
              <img
                src={result.link_preview_image}
                alt=""
                className="w-full h-20 object-cover opacity-80"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-1.5 border-t border-term-border text-[7px] text-term-dim text-center select-none">
          ↵ Enter to view details · Esc to dismiss
        </div>
      </div>
    </div>
  );
};
