import React from 'react';
import type { PanelId } from '../types';

const LABELS: Record<PanelId, string> = {
  filters: 'FILTERS',
  map: 'MAP',
  detail: 'DETAIL',
  timeline: 'TIMELINE',
  results: 'RESULTS',
};

interface PopoutHostProps {
  /** Which panel this popout window is rendering. */
  panel: PanelId;
  /** Called when the user clicks the dock button to return the panel to the parent. */
  onDock: (panel: PanelId) => void;
  /** The panel content to render inside the popout window. */
  children: React.ReactNode;
}

/**
 * Top-level scaffold for a popped-out panel window.
 *
 * Provides:
 * - Dark background matching the parent app theme.
 * - A compact title bar showing the panel name and a dock-back button.
 * - A flex container that fills the viewport for the child panel content.
 *
 * Usage from App.tsx or main.tsx:
 *   if (getPopoutPanel()) {
 *     return <PopoutHost panel={panel} onDock={…}>{…panel component…}</PopoutHost>;
 *   }
 */
export const PopoutHost: React.FC<PopoutHostProps> = ({
  panel,
  onDock,
  children,
}) => {
  return (
    <div className="h-full flex flex-col bg-term-bg font-mono text-[9px] text-term-primary overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between h-6 px-3 border-b border-term-border bg-term-surface flex-shrink-0">
        <span className="flex items-center gap-1.5 text-[8px] text-term-secondary select-none">
          <span className="inline-block w-1.5 h-1.5 bg-term-green animate-pulse-green" />
          <span className="uppercase tracking-wider">{LABELS[panel]}</span>
          <span className="text-term-muted ml-1">— popout</span>
        </span>

        <button
          onClick={() => onDock(panel)}
          className="px-2 py-0.5 border border-term-border text-[8px] text-term-secondary hover:text-term-green hover:border-term-green transition-colors uppercase tracking-wider"
          aria-label={`Dock ${LABELS[panel]} panel back into main window`}
        >
          ⮐ Dock
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};
