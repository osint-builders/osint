import React, { useCallback } from 'react';
import type { SearchResult } from '../types';
import { formatDateShort, truncate, copyToClipboard, getSourceIcon } from '../lib/utils';

interface EventRowProps {
  result: SearchResult;
  index: number;
  isSelected: boolean;
  showScore: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

export const EventRow: React.FC<EventRowProps> = React.memo(({
  result,
  index,
  isSelected,
  showScore,
  onSelect,
  onOpen,
}) => {
  const date = formatDateShort(result.date_event ?? result.date_published);
  const conf = result.confidence;
  const confPct = conf !== null ? Math.round(conf * 100) : null;
  const srcIcon = getSourceIcon(result.source_name);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(JSON.stringify(result, null, 2));
  }, [result]);

  const geoStr = [result.geo?.city, result.geo?.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      data-index={index}
      onClick={() => onSelect(result.id)}
      onDoubleClick={() => onOpen(result.id)}
      className={[
        'group relative flex flex-col gap-px px-3 py-2 cursor-pointer border-l-2 transition-colors duration-75',
        isSelected
          ? 'border-term-green bg-term-green-dim'
          : 'border-transparent hover:border-term-border-hi hover:bg-term-panel',
      ].join(' ')}
    >
      {/* Line 1: meta */}
      <div className="flex items-center gap-1.5 text-[7px] text-term-dim leading-tight min-w-0">
        <span
          className="flex-shrink-0 font-bold text-[7px] px-0.5 leading-none"
          style={{ color: srcIcon.color }}
          title={result.source_name}
        >
          {srcIcon.symbol}
        </span>
        <span className="text-term-secondary">{date}</span>
        {geoStr && <span>·</span>}
        {geoStr && <span className="text-term-dim truncate max-w-[80px]">{geoStr}</span>}
        <span>·</span>
        <span className="truncate min-w-0">{result.source_name}</span>
        {showScore && result.score > 1 && (
          <span className="ml-auto text-term-green flex-shrink-0">
            ↑{result.score.toFixed(0)}
          </span>
        )}
      </div>

      {/* Line 2: title */}
      <div className={[
        'text-[10px] font-medium leading-tight truncate transition-colors',
        isSelected ? 'text-term-green' : 'text-term-primary group-hover:text-[#e8e8e8]',
      ].join(' ')}>
        {result.title}
      </div>

      {/* Line 3: summary */}
      <div className="text-[8px] text-term-secondary leading-tight truncate">
        {truncate(result.summary, 120)}
      </div>

      {/* Line 4: topics + confidence + links indicator */}
      <div className="flex items-center gap-1 mt-px min-w-0">
        {result.topics.slice(0, 4).map(t => (
          <span
            key={t}
            className="text-[7px] px-1 border border-term-border text-term-dim leading-tight flex-shrink-0 truncate max-w-[60px]"
          >
            {t}
          </span>
        ))}
        {result.topics.length > 4 && (
          <span className="text-[7px] text-term-muted">+{result.topics.length - 4}</span>
        )}

        {/* Confidence */}
        {confPct !== null && (
          <span className="ml-auto flex items-center gap-1 flex-shrink-0">
            <span className="relative inline-block w-10 h-[2px] bg-term-border">
              <span
                className="absolute left-0 top-0 h-full bg-term-green"
                style={{ width: `${confPct}%` }}
              />
            </span>
            <span className="text-[7px] text-term-dim w-5 text-right">{confPct}%</span>
          </span>
        )}

        {/* Links indicator */}
        {result.links && result.links.length > 0 && (
          <span className="text-[7px] text-term-cyan flex-shrink-0 ml-1">
            ↗{result.links.length}
          </span>
        )}
      </div>

      {/* Hover copy button */}
      <button
        onClick={handleCopy}
        title="Copy event JSON"
        className="absolute right-2 top-2 text-[7px] text-term-dim hover:text-term-cyan opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ⊡
      </button>
    </div>
  );
});

EventRow.displayName = 'EventRow';
