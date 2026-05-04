import React, { useMemo } from 'react';
import type { SearchFilters, EventMetadata } from '../types';
import { todayISO, daysAgoISO, getTagColor } from '../lib/utils';

interface FilterRailProps {
  filters: SearchFilters;
  onFiltersChange: (f: SearchFilters) => void;
  allMetadata: EventMetadata[];
  collapsed: boolean;
}

const DEFAULT_FILTERS: SearchFilters = {
  dateFrom: null,
  dateTo: null,
  country: null,
  topics: [],
  minConfidence: 0,
};

export const FilterRail: React.FC<FilterRailProps> = ({
  filters,
  onFiltersChange,
  allMetadata,
  collapsed,
}) => {
  const { countries, topTopics } = useMemo(() => {
    const countrySet = new Set<string>();
    const topicCounts = new Map<string, number>();
    for (const e of allMetadata) {
      if (e.geo?.country) countrySet.add(e.geo.country);
      for (const t of e.topics) topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    }
    // Alphabetical, max 40
    const sortedTopics = [...topicCounts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, 40);
    return {
      countries: [...countrySet].sort(),
      topTopics: sortedTopics,
    };
  }, [allMetadata]);

  const isFiltered =
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.country !== null ||
    filters.topics.length > 0 ||
    filters.minConfidence > 0;

  if (collapsed) return null;

  return (
    <div className="w-44 flex-shrink-0 flex flex-col border-r border-term-border bg-term-surface overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-term-border flex-shrink-0">
        <span className="text-[8px] text-term-secondary tracking-widest">FILTERS</span>
        {isFiltered && (
          <button
            onClick={() => onFiltersChange(DEFAULT_FILTERS)}
            className="text-[7px] text-term-red hover:text-term-primary transition-colors"
          >
            CLEAR
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {/* Topics — facet surface, shown first */}
        <div>
          <div className="text-[7px] text-term-dim tracking-widest mb-1">
            TAGS
            {filters.topics.length > 0 && (
              <button
                onClick={() => onFiltersChange({ ...filters, topics: [] })}
                className="ml-2 text-term-red hover:text-term-primary transition-colors"
              >
                CLEAR
              </button>
            )}
          </div>
          <div className="space-y-px">
            {topTopics.map(([topic, count]) => {
              const active = filters.topics.includes(topic);
              const color = getTagColor(topic);
              return (
                <button
                  key={topic}
                  onClick={() => {
                    const next = active
                      ? filters.topics.filter(t => t !== topic)
                      : [...filters.topics, topic];
                    onFiltersChange({ ...filters, topics: next });
                  }}
                  className="w-full flex items-center gap-1.5 text-left py-0.5 pl-1 pr-1 transition-colors hover:bg-term-panel"
                  style={{ borderLeft: `3px solid ${active ? color : '#1a1a1a'}` }}
                >
                  <span
                    className="text-[8px] flex-1 truncate"
                    style={{ color: active ? color : '#666' }}
                  >
                    {topic}
                  </span>
                  <span className="text-[7px] text-term-muted flex-shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date range */}
        <div>
          <div className="text-[7px] text-term-dim tracking-widest mb-1">DATE RANGE</div>

          {/* Shortcut buttons */}
          <div className="flex flex-wrap gap-1 mb-2">
            {([
              { label: 'TODAY', from: todayISO(),    to: todayISO()    },
              { label: '7D',    from: daysAgoISO(7), to: todayISO()    },
              { label: '14D',   from: daysAgoISO(14),to: todayISO()    },
              { label: '30D',   from: daysAgoISO(30),to: todayISO()    },
            ] as const).map(({ label, from, to }) => {
              const active = filters.dateFrom === from && filters.dateTo === to;
              return (
                <button
                  key={label}
                  onClick={() => onFiltersChange({ ...filters, dateFrom: from, dateTo: to })}
                  className={`text-[7px] px-1.5 py-0.5 border transition-colors flex-1 ${
                    active
                      ? 'border-term-green text-term-green'
                      : 'border-term-border text-term-dim hover:text-term-secondary hover:border-term-border-hi'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <input
            type="date"
            value={filters.dateFrom ?? ''}
            max={todayISO()}
            onChange={e => onFiltersChange({ ...filters, dateFrom: e.target.value || null })}
            className="w-full bg-term-panel border border-term-border text-[8px] text-term-primary px-1 py-0.5 mb-1 focus:border-term-border-hi focus:outline-none"
          />
          <input
            type="date"
            value={filters.dateTo ?? ''}
            max={todayISO()}
            onChange={e => onFiltersChange({ ...filters, dateTo: e.target.value || null })}
            className="w-full bg-term-panel border border-term-border text-[8px] text-term-primary px-1 py-0.5 focus:border-term-border-hi focus:outline-none"
          />
        </div>

        {/* Country */}
        <div>
          <div className="text-[7px] text-term-dim tracking-widest mb-1">COUNTRY</div>
          <select
            value={filters.country ?? ''}
            onChange={e => onFiltersChange({ ...filters, country: e.target.value || null })}
            className="w-full bg-term-panel border border-term-border text-[8px] text-term-primary px-1 py-0.5 focus:border-term-border-hi focus:outline-none"
          >
            <option value="">All</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Confidence */}
        <div>
          <div className="text-[7px] text-term-dim tracking-widest mb-1">
            MIN CONF: <span className="text-term-cyan">{Math.round(filters.minConfidence * 100)}%</span>
          </div>
          {/* Mini confidence bar display */}
          <div className="w-full h-0.5 bg-term-border mb-1 relative">
            <div
              className="absolute left-0 top-0 h-full bg-term-green"
              style={{ width: `${filters.minConfidence * 100}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={filters.minConfidence}
            onChange={e => onFiltersChange({ ...filters, minConfidence: parseFloat(e.target.value) })}
            className="w-full accent-[#00ff41] h-0.5"
          />
        </div>

      </div>
    </div>
  );
};
