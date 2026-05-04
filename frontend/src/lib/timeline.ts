import type { SearchResult } from '../types';

export type TimeGranularity = 'hour' | 'day' | 'week';

export interface TimeGroup {
  key: string;
  label: string;
  sublabel: string;
  events: SearchResult[];
}

export function deriveGranularity(results: SearchResult[]): TimeGranularity {
  if (results.length < 2) return 'day';
  const dates = results
    .map(r => new Date(r.date_published).getTime())
    .filter(t => !isNaN(t));
  if (dates.length < 2) return 'day';
  const spanMs = Math.max(...dates) - Math.min(...dates);
  const spanDays = spanMs / 86_400_000;
  if (spanDays <= 2) return 'hour';
  if (spanDays <= 30) return 'day';
  return 'week';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function getBucketKey(dateStr: string, granularity: TimeGranularity): string {
  try {
    const d = new Date(dateStr);
    const y = d.getUTCFullYear();
    const mo = pad(d.getUTCMonth() + 1);
    const da = pad(d.getUTCDate());
    if (granularity === 'hour') {
      return `${y}-${mo}-${da}T${pad(d.getUTCHours())}`;
    }
    if (granularity === 'day') {
      return `${y}-${mo}-${da}`;
    }
    // week — ISO week key
    const jan1 = new Date(Date.UTC(y, 0, 1)).getTime();
    const week = Math.floor((d.getTime() - jan1) / (7 * 86_400_000));
    return `${y}-W${pad(week)}`;
  } catch {
    return 'unknown';
  }
}

const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export function getBucketLabel(key: string, granularity: TimeGranularity): { label: string; sublabel: string } {
  if (granularity === 'hour') {
    // "2026-05-04T14"
    const [datePart, hourPart] = key.split('T');
    const [, mo, da] = datePart.split('-').map(Number);
    const month = MONTH_ABBR[(mo ?? 1) - 1] ?? '';
    return { label: `${pad(da ?? 1)} ${month}`, sublabel: `${hourPart ?? '00'}:00 UTC` };
  }
  if (granularity === 'day') {
    const [y, mo, da] = key.split('-').map(Number);
    const month = MONTH_ABBR[(mo ?? 1) - 1] ?? '';
    return { label: `${pad(da ?? 1)} ${month}`, sublabel: String(y) };
  }
  // week
  const [y, wPart] = key.split('-W');
  return { label: `WK ${wPart}`, sublabel: String(y) };
}

/** Groups results by time bucket, sorted newest-first (leftmost). */
export function groupEventsByTime(results: SearchResult[]): TimeGroup[] {
  if (results.length === 0) return [];

  const granularity = deriveGranularity(results);
  const bucketMap = new Map<string, SearchResult[]>();

  for (const ev of results) {
    const key = getBucketKey(ev.date_published, granularity);
    if (!bucketMap.has(key)) bucketMap.set(key, []);
    bucketMap.get(key)!.push(ev);
  }

  return [...bucketMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0])) // newest first
    .map(([key, events]) => {
      const { label, sublabel } = getBucketLabel(key, granularity);
      // Sort events within bucket by date descending
      const sorted = [...events].sort((a, b) =>
        b.date_published.localeCompare(a.date_published)
      );
      return { key, label, sublabel, events: sorted };
    });
}
