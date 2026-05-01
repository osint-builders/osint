import React, { useMemo } from 'react';
import type { SearchFilters, EventMetadata } from '../types';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  allMetadata: EventMetadata[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  allMetadata
}) => {
  // Extract unique countries and top topics
  const { countries, topTopics } = useMemo(() => {
    const countrySet = new Set<string>();
    const topicCounts = new Map<string, number>();

    for (const event of allMetadata) {
      if (event.geo?.country) {
        countrySet.add(event.geo.country);
      }

      for (const topic of event.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }

    const sortedTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([topic]) => topic);

    return {
      countries: Array.from(countrySet).sort(),
      topTopics: sortedTopics
    };
  }, [allMetadata]);

  const handleTopicToggle = (topic: string) => {
    const newTopics = filters.topics.includes(topic)
      ? filters.topics.filter(t => t !== topic)
      : [...filters.topics, topic];

    onFiltersChange({ ...filters, topics: newTopics });
  };

  return (
    <div className="w-64 bg-gray-50 p-4 rounded-lg space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Filters</h2>

      {/* Date Range */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Date Range</h3>
        <div className="space-y-2">
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || null })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          />
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || null })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Country Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Country</h3>
        <select
          value={filters.country || ''}
          onChange={(e) => onFiltersChange({ ...filters, country: e.target.value || null })}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="">All Countries</option>
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      {/* Confidence Threshold */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Min Confidence: {filters.minConfidence.toFixed(1)}
        </h3>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={filters.minConfidence}
          onChange={(e) => onFiltersChange({ ...filters, minConfidence: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Topics Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Topics</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {topTopics.map(topic => (
            <label key={topic} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.topics.includes(topic)}
                onChange={() => handleTopicToggle(topic)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">{topic}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => onFiltersChange({
          dateFrom: null,
          dateTo: null,
          country: null,
          topics: [],
          minConfidence: 0
        })}
        className="w-full px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
};
