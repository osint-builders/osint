export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDateCompact(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    const h = String(d.getUTCHours()).padStart(2, '0');
    const mi = String(d.getUTCMinutes()).padStart(2, '0');
    return `${y}-${mo}-${da} ${h}:${mi}Z`;
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    const h = String(d.getUTCHours()).padStart(2, '0');
    const mi = String(d.getUTCMinutes()).padStart(2, '0');
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

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface SourceIcon { symbol: string; color: string; }

export function getSourceIcon(sourceName: string): SourceIcon {
  const s = sourceName.toLowerCase();
  if (s.includes('@') || s.startsWith('twitter') || s.includes('x.com') || s.includes('tweet'))
    return { symbol: '𝕏', color: '#1d9bf0' };
  if (s.includes('telegram'))
    return { symbol: 'TG', color: '#26a5e4' };
  if (s.includes('reuters'))
    return { symbol: 'R', color: '#ff8c00' };
  if (s.includes('bbc'))
    return { symbol: 'BBC', color: '#b5121b' };
  if (s.includes('cnn'))
    return { symbol: 'CNN', color: '#cc0001' };
  if (s.includes('fox'))
    return { symbol: 'FOX', color: '#003e8a' };
  if (s.includes('ap ') || s.includes('associated press'))
    return { symbol: 'AP', color: '#007af5' };
  if (s.includes('youtube') || s.includes('youtu.be'))
    return { symbol: '▶', color: '#ff0000' };
  if (s.includes('reddit'))
    return { symbol: '◐', color: '#ff4500' };
  if (s.includes('al jazeera'))
    return { symbol: 'AJ', color: '#c5980e' };
  if (s.includes('afp'))
    return { symbol: 'AFP', color: '#0066cc' };
  if (s.includes('guardian'))
    return { symbol: 'GRD', color: '#005689' };
  if (s.includes('bloomberg'))
    return { symbol: 'BBG', color: '#ff7800' };
  if (s.includes('nyt') || s.includes('new york times'))
    return { symbol: 'NYT', color: '#dfdfdf' };
  if (s.includes('perplexity'))
    return { symbol: 'PPX', color: '#20b2aa' };
  if (s.includes('gdelt'))
    return { symbol: 'GDT', color: '#9b59b6' };
  return { symbol: '◉', color: '#444' };
}
