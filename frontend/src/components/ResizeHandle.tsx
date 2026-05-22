import React from 'react';

export interface ResizeHandleProps {
  /** Whether the parent panel is actively being dragged. */
  isDragging: boolean;
  /** Pointer-down handler from useResizable. */
  onPointerDown: (e: React.PointerEvent) => void;
  /** Double-click handler from useResizable (reset to default). */
  onDoubleClick: () => void;
  /** Keyboard handler from useResizable. */
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** ARIA: current value. */
  ariaValueNow: number;
  /** ARIA: minimum value. */
  ariaValueMin: number;
  /** ARIA: maximum value. */
  ariaValueMax: number;
  /** Optional accessible label. */
  ariaLabel?: string;
}

/**
 * Vertical resize handle — sits between two panels.
 *
 * Layout: 12px-wide transparent hit area with a 4px visible bar centred
 * inside. Three grip dots appear on hover/drag for affordance.
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  isDragging,
  onPointerDown,
  onDoubleClick,
  onKeyDown,
  ariaValueNow,
  ariaValueMin,
  ariaValueMax,
  ariaLabel = 'Resize panel',
}) => {
  return (
    <div
      /* ── a11y ─────────────────────────────────────────────── */
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={ariaValueNow}
      aria-valuemin={ariaValueMin}
      aria-valuemax={ariaValueMax}
      aria-label={ariaLabel}
      tabIndex={0}
      /* ── interaction ──────────────────────────────────────── */
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      /* ── styling ──────────────────────────────────────────── */
      className={[
        // Hit area: 12px wide, full height, flex-centered.
        'relative w-3 flex-shrink-0 flex items-center justify-center',
        'cursor-col-resize select-none',
        // Keyboard focus ring.
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-term-green',
        // Group for hover state on the visible bar.
        'group',
      ].join(' ')}
    >
      {/* ── Visible bar (4px) ───────────────────────────────── */}
      <div
        className={[
          'w-1 h-full transition-colors duration-100',
          isDragging
            ? 'bg-term-green'
            : 'bg-term-border group-hover:bg-term-border-hi',
        ].join(' ')}
      />

      {/* ── Grip dots (3 stacked) ───────────────────────────── */}
      <div
        className={[
          'absolute inset-0 flex flex-col items-center justify-center gap-1',
          'pointer-events-none transition-opacity duration-100',
          isDragging
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
      >
        <span className="block w-1 h-1 rounded-full bg-term-secondary" />
        <span className="block w-1 h-1 rounded-full bg-term-secondary" />
        <span className="block w-1 h-1 rounded-full bg-term-secondary" />
      </div>
    </div>
  );
};
