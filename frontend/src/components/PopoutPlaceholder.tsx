import React from 'react';
import type { PanelId } from '../types';

const LABELS: Record<PanelId, string> = {
  filters: 'FILTERS',
  map: 'MAP',
  detail: 'DETAIL',
  timeline: 'TIMELINE',
  results: 'RESULTS',
};

interface PopoutPlaceholderProps {
  panel: PanelId;
  /** Called when the user clicks dock-back to re-embed the panel. */
  onDockBack: (panel: PanelId) => void;
}

/**
 * Thin 24 px indicator strip rendered in the parent layout when a panel
 * has been popped out into a separate window. Shows the panel name and a
 * dock-back button. Uses aria-live so screen readers announce state changes.
 */
export const PopoutPlaceholder: React.FC<PopoutPlaceholderProps> = ({
  panel,
  onDockBack,
}) => {
  return (
    <div
      className="flex items-center justify-between h-6 px-3 border border-term-border bg-term-surface text-[8px] text-term-secondary font-mono flex-shrink-0"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1.5 select-none">
        <span className="inline-block w-1.5 h-1.5 bg-term-yellow animate-pulse-green" />
        <span className="text-term-dim uppercase tracking-wider">
          {LABELS[panel]} — popped out
        </span>
      </span>

      <button
        onClick={() => onDockBack(panel)}
        className="px-2 py-0.5 border border-term-border text-term-secondary hover:text-term-green hover:border-term-green transition-colors uppercase tracking-wider"
        aria-label={`Dock ${LABELS[panel]} panel back`}
      >
        ⮐ Dock
      </button>
    </div>
  );
};
