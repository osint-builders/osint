
function formatDateParts(d: Date): { mo: string; da: string; h: string; mi: string } {
  return {
    mo: String(d.getUTCMonth() + 1).padStart(2, '0'),
    da: String(d.getUTCDate()).padStart(2, '0'),
    h: String(d.getUTCHours()).padStart(2, '0'),
    mi: String(d.getUTCMinutes()).padStart(2, '0'),
  };
}

export function formatDateCompact(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const y = d.getUTCFullYear();
    const { mo, da, h, mi } = formatDateParts(d);
    return `${y}-${mo}-${da} ${h}:${mi}Z`;
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const { mo, da, h, mi } = formatDateParts(d);
    return `${mo}-${da} ${h}:${mi}Z`;
  } catch {
    return dateStr;
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n).trimEnd() + '…' : str;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ── Tag color ─────────────────────────────────────────────────
const TAG_PALETTE = [
  '#00cfff', '#ffd700', '#ff6b35', '#b06cff',
  '#26a5e4', '#ff8c00', '#20b2aa', '#a8ff00',
  '#ff3f8e', '#c5980e', '#00e5ff', '#9b59b6',
];

export function getTagColor(tag: string): string {
  // FNV-1a 32-bit hash for deterministic, visually distinct colors per tag
  let h = 2166136261;
  for (let i = 0; i < tag.length; i++) {
    h ^= tag.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return TAG_PALETTE[h % TAG_PALETTE.length];
}

export interface SourceIcon { symbol: string; color: string; network?: string; }

const SOURCE_PATTERNS: Array<{ test: (s: string, u: string) => boolean; icon: SourceIcon }> = [
  { test: (s, u) => u.includes('t.me/') || s.includes('telegram'), icon: { symbol: '✈', color: '#26a5e4', network: 'telegram' } },
  { test: (s, u) => s.includes('@') || s.startsWith('twitter') || u.includes('x.com/') || u.includes('twitter.com/') || s.includes('tweet'), icon: { symbol: '𝕏', color: '#1d9bf0', network: 'x' } },
  { test: (s) => s.includes('reuters'), icon: { symbol: 'R', color: '#ff8c00' } },
  { test: (s) => s.includes('bbc'), icon: { symbol: 'BBC', color: '#b5121b' } },
  { test: (s) => s.includes('cnn'), icon: { symbol: 'CNN', color: '#cc0001' } },
  { test: (s) => s.includes('fox'), icon: { symbol: 'FOX', color: '#003e8a' } },
  { test: (s) => s.includes('ap ') || s.includes('associated press'), icon: { symbol: 'AP', color: '#007af5' } },
  { test: (s) => s.includes('youtube') || s.includes('youtu.be'), icon: { symbol: '▶', color: '#ff0000', network: 'youtube' } },
  { test: (s) => s.includes('reddit'), icon: { symbol: '◐', color: '#ff4500', network: 'reddit' } },
  { test: (s) => s.includes('al jazeera'), icon: { symbol: 'AJ', color: '#c5980e' } },
  { test: (s) => s.includes('afp'), icon: { symbol: 'AFP', color: '#0066cc' } },
  { test: (s) => s.includes('guardian'), icon: { symbol: 'GRD', color: '#005689' } },
  { test: (s) => s.includes('bloomberg'), icon: { symbol: 'BBG', color: '#ff7800' } },
  { test: (s) => s.includes('nyt') || s.includes('new york times'), icon: { symbol: 'NYT', color: '#dfdfdf' } },
  { test: (s) => s.includes('perplexity'), icon: { symbol: 'PPX', color: '#20b2aa' } },
  { test: (s) => s.includes('gdelt'), icon: { symbol: 'GDT', color: '#9b59b6' } },
];

export function getSourceIcon(sourceName: string, firstLinkUrl?: string): SourceIcon {
  const s = sourceName.toLowerCase();
  const u = (firstLinkUrl ?? '').toLowerCase();

  for (const { test, icon } of SOURCE_PATTERNS) {
    if (test(s, u)) return icon;
  }
  return { symbol: '◉', color: '#444' };
}
