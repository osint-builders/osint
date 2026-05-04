import React, { useMemo } from 'react';
import type { SearchFilters, EventMetadata } from '../types';

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
    const sortedTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25);
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

  const toggleTopic = (topic: string) => {
    const next = filters.topics.includes(topic)
      ? filters.topics.filter(t => t !== topic)
      : [...filters.topics, topic];
    onFiltersChange({ ...filters, topics: next });
  };

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
        {/* Date range */}
        <div>
          <div className="text-[7px] text-term-dim tracking-widest mb-1">DATE RANGE</div>
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={e => onFiltersChange({ ...filters, dateFrom: e.target.value || null })}
            className="w-full bg-term-panel border border-term-border text-[8px] text-term-primary px-1 py-0.5 mb-1 focus:border-term-border-hi focus:outline-none"
          />
          <input
            type="date"
            value={filters.dateTo ?? ''}
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

        {/* Topics */}
        <div>
          <div className="text-[7px] text-term-dim tracking-widest mb-1">TOPICS</div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {topTopics.map(([topic, count]) => {
              const active = filters.topics.includes(topic);
              return (
                <label
                  key={topic}
                  className={`flex items-center gap-1.5 cursor-pointer py-0.5 px-1 transition-colors ${
                    active ? 'bg-term-green-dim' : 'hover:bg-term-panel'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleTopic(topic)}
                    className="w-2 h-2 accent-[#00ff41]"
                  />
                  <span className={`text-[8px] flex-1 truncate ${active ? 'text-term-green' : 'text-term-secondary'}`}>
                    {topic}
                  </span>
                  <span className="text-[7px] text-term-dim flex-shrink-0">{count}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
