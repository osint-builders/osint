import React from 'react';

/**
 * Split a search query into individual tokens, filtering out
 * single-char tokens that are too short to be meaningful.
 */
export function tokenizeQuery(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 1);
}

interface MatchRange {
  start: number;
  end: number;
}

/**
 * Merge overlapping or adjacent ranges into non-overlapping sorted ranges.
 */
function mergeRanges(ranges: MatchRange[]): MatchRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: MatchRange[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];
    if (curr.start <= prev.end) {
      prev.end = Math.max(prev.end, curr.end);
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

/**
 * Split text into segments, wrapping matched query tokens in highlighted
 * <span> elements. Returns an array of ReactNode (strings and JSX spans).
 * Case-insensitive matching with overlapping range merging.
 */
export function highlightMatches(
  text: string,
  queryTokens: string[],
): React.ReactNode[] {
  if (!text || queryTokens.length === 0) return [text];

  // Find all match ranges
  const ranges: MatchRange[] = [];
  const lowerText = text.toLowerCase();

  for (const token of queryTokens) {
    const lowerToken = token.toLowerCase();
    let idx = 0;
    while ((idx = lowerText.indexOf(lowerToken, idx)) !== -1) {
      ranges.push({ start: idx, end: idx + lowerToken.length });
      idx += 1;
    }
  }

  if (ranges.length === 0) return [text];

  const merged = mergeRanges(ranges);
  const result: React.ReactNode[] = [];
  let cursor = 0;

  for (let i = 0; i < merged.length; i++) {
    const { start, end } = merged[i];
    // Add unmatched text before this range
    if (cursor < start) {
      result.push(text.slice(cursor, start));
    }
    // Add highlighted match
    result.push(
      React.createElement(
        'span',
        {
          key: `hl-${i}`,
          className: 'bg-yellow-400/30 text-yellow-200 rounded-sm px-0.5',
        },
        text.slice(start, end),
      ),
    );
    cursor = end;
  }

  // Add remaining text
  if (cursor < text.length) {
    result.push(text.slice(cursor));
  }

  return result;
}
