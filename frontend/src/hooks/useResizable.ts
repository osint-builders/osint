import { useState, useCallback, useRef, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────

export type ResizeDirection = 'left' | 'right';

export interface UseResizableOptions {
  /** Unique key for localStorage persistence. Omit to disable persistence. */
  storageKey?: string;
  /** Minimum width in pixels. */
  min: number;
  /** Maximum width in pixels (static). Ignored when `getMax` is provided. */
  max: number;
  /** Default / initial width in pixels. */
  defaultWidth: number;
  /** Which edge of the panel the handle sits on. */
  direction?: ResizeDirection;
  /**
   * Dynamic max callback — called on every pointer-move to compute a
   * live ceiling (e.g. to keep combined panels within a container).
   * Takes precedence over the static `max` when provided.
   */
  getMax?: () => number;
  /** Step size in px for keyboard resizing (Arrow keys). Default 8. */
  keyboardStep?: number;
}

export interface UseResizableReturn {
  /** Current panel width in px. */
  width: number;
  /** Whether the user is currently dragging. */
  isDragging: boolean;
  /** Bind to the resize handle's onPointerDown. */
  onPointerDown: (e: React.PointerEvent) => void;
  /** Bind to the resize handle's onDoubleClick to reset to default. */
  onDoubleClick: () => void;
  /** Bind to the resize handle's onKeyDown for keyboard resizing. */
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** ARIA: current value for the separator. */
  ariaValueNow: number;
  /** ARIA: minimum value. */
  ariaValueMin: number;
  /** ARIA: maximum value. */
  ariaValueMax: number;
}

// ── localStorage helpers ──────────────────────────────────────

function loadWidth(key: string | undefined, fallback: number): number {
  if (!key) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function persistWidth(key: string | undefined, value: number): void {
  if (!key) return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage full or unavailable — silently ignore.
  }
}

// ── Hook ──────────────────────────────────────────────────────

export function useResizable(opts: UseResizableOptions): UseResizableReturn {
  const {
    storageKey,
    min,
    max,
    defaultWidth,
    direction = 'right',
    getMax,
    keyboardStep = 8,
  } = opts;

  const [width, setWidth] = useState(() => {
    const saved = loadWidth(storageKey, defaultWidth);
    return Math.max(min, Math.min(saved, getMax ? getMax() : max));
  });
  const [isDragging, setIsDragging] = useState(false);

  // Refs to avoid stale closures in document-level listeners.
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const directionRef = useRef(direction);
  directionRef.current = direction;

  const clamp = useCallback(
    (v: number) => {
      const upper = getMax ? getMax() : max;
      return Math.max(min, Math.min(v, upper));
    },
    [min, max, getMax],
  );

  // ── Pointer drag (document-level) ────────────────────────

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only handle primary button.
      if (e.button !== 0) return;
      e.preventDefault();

      startXRef.current = e.clientX;
      startWidthRef.current = width;
      setIsDragging(true);

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width],
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - startXRef.current;
      const sign = directionRef.current === 'right' ? 1 : -1;
      const next = clamp(startWidthRef.current + dx * sign);
      setWidth(next);
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, clamp]);

  // Persist after drag ends (not on every pixel).
  const prevDragging = useRef(isDragging);
  useEffect(() => {
    if (prevDragging.current && !isDragging) {
      persistWidth(storageKey, width);
    }
    prevDragging.current = isDragging;
  }, [isDragging, storageKey, width]);

  // ── Double-click reset ───────────────────────────────────

  const onDoubleClick = useCallback(() => {
    const clamped = clamp(defaultWidth);
    setWidth(clamped);
    persistWidth(storageKey, clamped);
  }, [clamp, defaultWidth, storageKey]);

  // ── Keyboard resize ──────────────────────────────────────

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let delta = 0;
      if (e.key === 'ArrowLeft') delta = -keyboardStep;
      else if (e.key === 'ArrowRight') delta = keyboardStep;
      else if (e.key === 'Home') {
        e.preventDefault();
        const next = clamp(min);
        setWidth(next);
        persistWidth(storageKey, next);
        return;
      } else if (e.key === 'End') {
        e.preventDefault();
        const next = clamp(getMax ? getMax() : max);
        setWidth(next);
        persistWidth(storageKey, next);
        return;
      } else {
        return;
      }

      e.preventDefault();
      const sign = direction === 'right' ? 1 : -1;
      setWidth(prev => {
        const next = clamp(prev + delta * sign);
        persistWidth(storageKey, next);
        return next;
      });
    },
    [keyboardStep, clamp, min, max, getMax, direction, storageKey],
  );

  return {
    width,
    isDragging,
    onPointerDown,
    onDoubleClick,
    onKeyDown,
    ariaValueNow: Math.round(width),
    ariaValueMin: min,
    ariaValueMax: getMax ? getMax() : max,
  };
}
