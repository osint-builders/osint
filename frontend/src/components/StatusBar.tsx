import React from 'react';
import { formatDateCompact } from '../lib/utils';

interface StatusBarProps {
  isReady: boolean;
  isSearching: boolean;
  eventCount: number;
  resultCount: number;
  selectedIndex: number;
  lastUpdated: string | null;
  toast: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isReady,
  isSearching,
  eventCount,
  resultCount,
  selectedIndex,
  lastUpdated,
  toast,
}) => {
  return (
    <div className="flex items-center h-5 px-3 border-t border-term-border bg-term-surface text-[8px] text-term-secondary font-mono flex-shrink-0 gap-4 overflow-hidden">
      {/* Status indicator */}
      <span className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            isSearching
              ? 'bg-term-yellow animate-pulse-green'
              : isReady
              ? 'bg-term-green animate-pulse-green'
              : 'bg-term-dim'
          }`}
        />
        <span className="text-term-dim">
          {isSearching ? 'SEARCHING' : isReady ? 'READY' : 'LOADING'}
        </span>
      </span>

      {/* Event counts */}
      <span className="text-term-dim flex-shrink-0">
        {resultCount.toLocaleString()}/{eventCount.toLocaleString()} EVT
      </span>

      {/* Selection */}
      {selectedIndex >= 0 && (
        <span className="text-term-dim flex-shrink-0">
          SEL:{selectedIndex + 1}
        </span>
      )}

      {/* Last index date */}
      {lastUpdated && (
        <span className="text-term-dim flex-shrink-0">
          IDX:{formatDateCompact(lastUpdated)}
        </span>
      )}

      {/* Toast message */}
      {toast && (
        <span className="text-term-green animate-fade-in flex-shrink-0 ml-2">
          {toast}
        </span>
      )}

      {/* Shortcuts hint — right-aligned */}
      <span className="ml-auto text-term-muted flex-shrink-0 hidden sm:flex gap-3">
        <span>[/] SEARCH</span>
        <span>[J/K] NAV</span>
        <span>[ENTER] OPEN</span>
        <span>[M] MAP</span>
        <span>[S] SAVE</span>
        <span>[?] HELP</span>
      </span>
    </div>
  );
};
