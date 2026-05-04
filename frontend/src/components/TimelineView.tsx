import React, {
  useRef, useEffect, useCallback, useMemo,
} from 'react';
import gsap from 'gsap';
import type { SearchResult } from '../types';
import { groupEventsByTime } from '../lib/timeline';
import { getTagColor, getSourceIcon, formatDateShort } from '../lib/utils';

const CARD_W = 200;
const COL_GAP = 12;
const COL_W = CARD_W + COL_GAP;
const CARD_GAP = 6;
const TRACK_PAD_LEFT = 24;

interface TimelineViewProps {
  results: SearchResult[];
  selectedId: string | null;
  onSelectEvent: (id: string) => void;
  onOpenEvent: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  results,
  selectedId,
  onSelectEvent,
  onOpenEvent,
  onTagClick,
}) => {
  const groups = useMemo(() => groupEventsByTime(results), [results]);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackInnerRef = useRef<HTMLDivElement>(null);
  const railInnerRef = useRef<HTMLDivElement>(null);
  const scrubberCanvasRef = useRef<HTMLCanvasElement>(null);
  const scrollXRef = useRef(0);
  const totalWidth = groups.length * COL_W + TRACK_PAD_LEFT * 2;

  const getViewWidth = useCallback(
    () => containerRef.current?.clientWidth ?? window.innerWidth,
    []
  );

  const maxScroll = useCallback(
    () => Math.max(0, totalWidth - getViewWidth()),
    [totalWidth, getViewWidth]
  );

  // -- Scrubber rendering -------------------------------------------------
  const drawScrubber = useCallback(() => {
    const canvas = scrubberCanvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.parentElement.clientWidth;
    const cssH = canvas.parentElement.clientHeight;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = cssW, h = cssH;
    ctx.clearRect(0, 0, w, h);

    const barH = h - 10;
    const maxCount = Math.max(...groups.map(g => g.events.length), 1);

    // Density bars
    groups.forEach((g, i) => {
      const bw = w / groups.length;
      const bh = (g.events.length / maxCount) * barH;
      const x = i * bw;
      ctx.fillStyle = '#111';
      ctx.fillRect(x, h - barH - 4, bw - 1, barH);
      ctx.fillStyle = '#00cfff30';
      ctx.fillRect(x, h - bh - 4, bw - 1, bh);
    });

    // Viewport thumb
    const max = maxScroll();
    const vw = getViewWidth();
    const thumbW = max > 0 ? Math.max(24, (vw / totalWidth) * w) : w;
    const progress = max > 0 ? (-scrollXRef.current) / max : 0;
    const thumbX = progress * (w - thumbW);
    ctx.fillStyle = '#00ff4120';
    ctx.fillRect(thumbX, 0, thumbW, h - 4);
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 1;
    ctx.strokeRect(thumbX + 0.5, 0.5, thumbW - 1, h - 5);
  }, [groups, maxScroll, totalWidth, getViewWidth]);

  // -- Animation helper --------------------------------------------------
  const animateTo = useCallback((targetX: number, duration = 0.3) => {
    const max = maxScroll();
    const clamped = Math.max(-max, Math.min(0, targetX));
    scrollXRef.current = clamped;
    const targets = [trackInnerRef.current, railInnerRef.current].filter(Boolean);
    gsap.to(targets, {
      x: clamped,
      duration,
      ease: 'power2.out',
      onUpdate: drawScrubber,
    });
  }, [maxScroll, drawScrubber]);

  // -- Initial entrance animation + scrubber resize ----------------------
  useEffect(() => {
    if (!trackInnerRef.current) return;
    scrollXRef.current = 0;
    gsap.set([trackInnerRef.current, railInnerRef.current], { x: 0 });
    const cards = trackInnerRef.current.querySelectorAll('[data-card]');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.2, stagger: 0.006, ease: 'power2.out' }
    );
    drawScrubber();
  }, [groups, drawScrubber]);

  // Resize observer for scrubber
  useEffect(() => {
    const ro = new ResizeObserver(drawScrubber);
    const el = scrubberCanvasRef.current?.parentElement;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [drawScrubber]);

  // -- Pointer drag on track ---------------------------------------------
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });

  const onTrackPointerDown = useCallback((e: React.PointerEvent) => {
    // Don't drag if clicking a card button
    if ((e.target as HTMLElement).closest('[data-card]')) return;
    drag.current = { active: true, startX: e.clientX, startScroll: scrollXRef.current };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onTrackPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const delta = e.clientX - drag.current.startX;
    animateTo(drag.current.startScroll + delta, 0);
  }, [animateTo]);

  const onTrackPointerUp = useCallback(() => {
    drag.current.active = false;
  }, []);

  // -- Wheel scroll -------------------------------------------------------
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    animateTo(scrollXRef.current - delta * 1.2, 0.08);
  }, [animateTo]);

  // -- Arrow key nav -------------------------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as Element)?.tagName ?? '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        animateTo(scrollXRef.current + COL_W * 4);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        animateTo(scrollXRef.current - COL_W * 4);
      }
    };
    window.addEventListener('keydown', handler, { passive: false });
    return () => window.removeEventListener('keydown', handler);
  }, [animateTo]);

  // -- Scrubber interaction -----------------------------------------------
  const onScrubberPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    canvas.setPointerCapture(e.pointerId);
    const jump = (clientX: number) => {
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      animateTo(-ratio * maxScroll());
    };
    jump(e.clientX);
    const onMove = (ev: PointerEvent) => jump(ev.clientX);
    const onUp = () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
  }, [animateTo, maxScroll]);

  // -- Empty state ---------------------------------------------------------
  if (groups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[9px] text-term-dim">
        <span className="text-[20px] text-term-muted">◎</span>
        <span>NO EVENTS IN RANGE</span>
        <span className="text-[8px]">Adjust date filters to see the timeline</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col min-h-0 bg-term-bg overflow-hidden select-none"
    >
      {/* Pinned time-group rail */}
      <div className="flex-shrink-0 h-10 border-b border-term-border bg-term-surface overflow-hidden relative">
        <div
          ref={railInnerRef}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            height: '100%',
            paddingLeft: TRACK_PAD_LEFT,
            willChange: 'transform',
          }}
        >
          {groups.map(g => (
            <div
              key={g.key}
              style={{ width: COL_W, minWidth: COL_W, flexShrink: 0 }}
              className="flex flex-col justify-center pl-2 border-l border-term-border"
            >
              <span className="text-[9px] text-term-primary font-medium leading-none">{g.label}</span>
              <span className="text-[7px] text-term-dim leading-none mt-0.5">
                {g.sublabel} · {g.events.length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable track */}
      <div
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={onTrackPointerUp}
        onPointerCancel={onTrackPointerUp}
      >
        <div
          ref={trackInnerRef}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            height: '100%',
            paddingLeft: TRACK_PAD_LEFT,
            paddingTop: 8,
            paddingBottom: 8,
            gap: 0,
            willChange: 'transform',
          }}
        >
          {groups.map(g => (
            <div
              key={g.key}
              style={{
                width: COL_W,
                minWidth: COL_W,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: CARD_GAP,
                paddingRight: COL_GAP,
                overflowY: 'auto',
                maxHeight: '100%',
              }}
            >
              {g.events.map(ev => {
                const icon = getSourceIcon(ev.source_name);
                const topicColor = ev.topics.length > 0 ? getTagColor(ev.topics[0]) : '#444';
                const confPct = ev.confidence != null ? Math.round(ev.confidence * 100) : null;
                const isSelected = ev.id === selectedId;

                return (
                  <div
                    key={ev.id}
                    data-card
                    onClick={() => onSelectEvent(ev.id)}
                    onDoubleClick={() => onOpenEvent(ev.id)}
                    style={{ borderLeft: `3px solid ${topicColor}` }}
                    className={[
                      'flex-shrink-0 p-2 cursor-pointer transition-colors duration-75 border border-term-border',
                      isSelected
                        ? 'bg-term-green-dim border-term-green'
                        : 'bg-term-surface hover:bg-term-panel',
                    ].join(' ')}
                  >
                    {/* Source + date */}
                    <div className="flex items-center gap-1 text-[7px] mb-1 min-w-0">
                      <span style={{ color: icon.color, fontWeight: 700 }} className="flex-shrink-0">
                        {icon.symbol}
                      </span>
                      <span className={isSelected ? 'text-[#c0c0c0]' : 'text-term-secondary'}>
                        {formatDateShort(ev.date_event ?? ev.date_published)}
                      </span>
                      {ev.geo?.country && (
                        <span className={`truncate ${isSelected ? 'text-[#a0a0a0]' : 'text-term-dim'}`}>
                          · {ev.geo.country}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div
                      className={`text-[9px] font-medium leading-snug mb-1.5 ${
                        isSelected ? 'text-term-green' : 'text-term-primary'
                      }`}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {ev.title}
                    </div>

                    {/* Confidence bar */}
                    {confPct !== null && (
                      <div className="relative w-full h-px bg-term-border mb-1.5">
                        <div
                          className="absolute left-0 top-0 h-full bg-term-green"
                          style={{ width: `${confPct}%` }}
                        />
                      </div>
                    )}

                    {/* Topic pills */}
                    {ev.topics.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {[...ev.topics].sort().slice(0, 2).map(t => (
                          <button
                            key={t}
                            onClick={e => { e.stopPropagation(); onTagClick(t); }}
                            className="text-[7px] px-1 border transition-opacity hover:opacity-70 flex-shrink-0 max-w-[80px] truncate"
                            style={{ borderColor: getTagColor(t), color: getTagColor(t) }}
                          >
                            {t}
                          </button>
                        ))}
                        {ev.topics.length > 2 && (
                          <span className="text-[7px] text-term-muted">+{ev.topics.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Scrubber */}
      <div className="flex-shrink-0 border-t border-term-border bg-term-surface">
        <div className="flex items-center justify-between px-3 pt-1 text-[7px] text-term-dim">
          <span className="text-term-green">← NEWEST</span>
          <span>{results.length} EVENTS · {groups.length} GROUPS · DRAG/SCROLL · DBL-CLICK → DETAIL</span>
          <span className="text-term-dim">OLDEST →</span>
        </div>
        <div className="relative w-full" style={{ height: 28 }}>
          <canvas
            ref={scrubberCanvasRef}
            className="absolute inset-0 cursor-pointer w-full h-full"
            onPointerDown={onScrubberPointerDown}
          />
        </div>
      </div>
    </div>
  );
};
