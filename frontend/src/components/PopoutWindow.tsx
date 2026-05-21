import React, { useState, useEffect, useCallback } from 'react';
import { PopoutHost } from './PopoutHost';
import { FilterRail } from './FilterRail';
import { ResultsPane } from './ResultsPane';
import { MapView } from './MapView';
import { EventDetail } from './EventDetail';
import { TimelineView } from './TimelineView';
import { useBroadcastChild } from '../hooks/useBroadcastSync';
import { IndexLoader } from '../lib/IndexLoader';
import type {
  PanelId,
  PopoutSyncState,
  EventMetadata,
} from '../types';
import { PANEL_DEFAULTS } from '../types';

const loader = new IndexLoader();

export const PopoutWindow: React.FC<{ panel: PanelId }> = ({ panel }) => {
  const [state, setState] = useState<PopoutSyncState | null>(null);
  const [allMetadata, setAllMetadata] = useState<EventMetadata[]>([]);

  const dispatch = useBroadcastChild(useCallback((s: PopoutSyncState) => setState(s), []));

  // FilterRail needs allMetadata for topic/country lists — load independently.
  useEffect(() => {
    if (panel === 'filters') {
      loader.loadMetadata().then(setAllMetadata).catch(() => {});
    }
  }, [panel]);

  // Set popup window title.
  useEffect(() => {
    document.title = PANEL_DEFAULTS[panel].title;
  }, [panel]);

  // ── Action dispatchers ──────────────────────────────────────
  const handleDock = useCallback(
    (p: PanelId) => dispatch({ kind: 'popIn', panel: p }),
    [dispatch],
  );
  const handleSelect = useCallback(
    (id: string) => dispatch({ kind: 'select', id }),
    [dispatch],
  );
  const handleOpen = useCallback(
    (id: string) => dispatch({ kind: 'open', id }),
    [dispatch],
  );
  const handleTagClick = useCallback(
    (tag: string) => dispatch({ kind: 'tagClick', tag }),
    [dispatch],
  );

  // ── Loading state ───────────────────────────────────────────
  if (!state) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-term-bg font-mono text-[9px] text-term-dim gap-2">
        <span className="text-term-green animate-pulse-green text-[12px]">⟳</span>
        <span>CONNECTING…</span>
      </div>
    );
  }

  // ── Panel rendering ─────────────────────────────────────────
  const renderPanel = () => {
    switch (panel) {
      case 'filters':
        return (
          <FilterRail
            filters={state.filters}
            onFiltersChange={f => dispatch({ kind: 'setFilters', filters: f })}
            allMetadata={allMetadata}
            collapsed={false}
          />
        );

      case 'results':
        return (
          <ResultsPane
            results={state.results}
            selectedId={state.selectedId}
            isSearching={false}
            query={state.query}
            sorts={state.sorts}
            onSortChange={(field, dir) =>
              dispatch({ kind: 'setSort', field, dir })
            }
            onClearSorts={() => dispatch({ kind: 'clearSorts' })}
            onSelect={handleSelect}
            onOpen={handleOpen}
            onTagClick={handleTagClick}
          />
        );

      case 'map':
        return (
          <MapView
            results={state.results}
            selectedId={state.selectedId}
            onSelectEvent={handleSelect}
            onOpenEvent={handleOpen}
          />
        );

      case 'detail':
        return (
          <EventDetail
            metadata={state.results.find(r => r.id === state.selectedId) ?? null}
            detail={state.eventDetail}
            isLoading={state.isLoadingDetail}
            onClose={() => {}}
            onShowMap={() => {}}
          />
        );

      case 'timeline':
        return (
          <TimelineView
            results={state.results}
            selectedId={state.selectedId}
            onSelectEvent={handleSelect}
            onOpenEvent={handleOpen}
            onTagClick={handleTagClick}
          />
        );

      default:
        return null;
    }
  };

  return (
    <PopoutHost panel={panel} onDock={handleDock}>
      {renderPanel()}
    </PopoutHost>
  );
};
