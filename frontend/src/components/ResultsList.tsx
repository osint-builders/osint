import React from 'react';
import type { SearchResult } from '../types';

interface ResultsListProps {
  results: SearchResult[];
}

export const ResultsList: React.FC<ResultsListProps> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No results found. Try a different search query.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <ResultCard key={result.id} result={result} />
      ))}
    </div>
  );
};

const ResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      });
    } catch {
      return dateStr;
    }
  };

  const truncateSummary = (summary: string, maxLength: number = 200) => {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {result.title}
      </h3>

      {/* Summary */}
      <p className="text-gray-700 text-sm mb-3">
        {truncateSummary(result.summary)}
      </p>

      {/* Metadata chips */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Date */}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {formatDate(result.date_event || result.date_published)}
        </span>

        {/* Country */}
        {result.geo?.country && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {result.geo.country}
          </span>
        )}

        {/* Confidence */}
        {result.confidence !== null && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {(result.confidence * 100).toFixed(0)}% confidence
          </span>
        )}

        {/* Source */}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {result.source_name}
        </span>
      </div>

      {/* Topics */}
      {result.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {result.topics.slice(0, 5).map((topic, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
            >
              {topic}
            </span>
          ))}
          {result.topics.length > 5 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              +{result.topics.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};
