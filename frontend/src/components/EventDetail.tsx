import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { EventDetail as EventDetailType, EventMetadata } from '../types';
import { formatDateCompact, copyToClipboard, getDomainFromUrl } from '../lib/utils';

interface EventDetailProps {
  metadata: EventMetadata | null;
  detail: EventDetailType | null;
  isLoading: boolean;
  onClose: () => void;
  onShowMap: () => void;
}

const CopyBtn: React.FC<{ text: string; label?: string }> = ({ text, label = '⊡' }) => {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(() => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [text]);
  return (
    <button
      onClick={handle}
      className="text-[7px] text-term-dim hover:text-term-cyan transition-colors ml-1 flex-shrink-0"
      title="Copy"
    >
      {copied ? '✓' : label}
    </button>
  );
};

const Field: React.FC<{ label: string; value?: string | null; children?: React.ReactNode }> = ({
  label, value, children
}) => (
  <div className="flex items-start gap-2 py-0.5 border-b border-term-border last:border-0 min-w-0">
    <span className="text-[7px] text-term-dim tracking-widest w-16 flex-shrink-0 pt-px uppercase">{label}</span>
    <span className="text-[8px] text-term-secondary flex-1 min-w-0 break-all">
      {children ?? value ?? '—'}
    </span>
  </div>
);

export const EventDetail: React.FC<EventDetailProps> = ({
  metadata,
  detail,
  isLoading,
  onClose,
  onShowMap,
}) => {
  const event = detail ?? metadata;

  if (!event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[8px] text-term-dim gap-2 border-l border-term-border">
        <span className="text-[16px] text-term-muted">◌</span>
        <span>SELECT AN EVENT</span>
        <span className="text-[7px] text-term-muted">J/K to navigate · Enter to open</span>
      </div>
    );
  }

  if (isLoading && !metadata) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[8px] text-term-dim gap-2 border-l border-term-border">
        <span className="text-term-green animate-pulse-green text-[12px]">⟳</span>
        <span>LOADING…</span>
      </div>
    );
  }

  const conf = event.confidence;
  const confPct = conf !== null ? Math.round(conf * 100) : null;
  const geo = event.geo;
  const geoStr = [geo?.city, geo?.region, geo?.country].filter(Boolean).join(', ');
  const links = detail?.links ?? metadata?.links ?? [];
  const contents = detail?.contents;

  const previewImage = detail?.link_preview?.image ?? metadata?.link_preview_image ?? null;

  return (
    <div className="flex-1 flex flex-col min-h-0 border-l border-term-border bg-term-surface animate-slide-in">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-term-border flex-shrink-0">
        <span className="text-[8px] text-term-dim flex-1 truncate">
          {event.id}
          <CopyBtn text={event.id} />
        </span>
        <button
          onClick={onShowMap}
          title="Show map [M]"
          className="text-[8px] text-term-secondary hover:text-term-cyan transition-colors px-1 flex-shrink-0"
        >
          ◉ MAP
        </button>
        <button
          onClick={onClose}
          title="Close [Esc]"
          className="text-[8px] text-term-dim hover:text-term-primary transition-colors flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Link preview banner */}
        {previewImage && (
          <div
            className="-mx-3 -mt-2 mb-1 relative h-[140px] flex-shrink-0 overflow-hidden"
            style={{
              backgroundImage: `url(${previewImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Semi-transparent dark overlay — mutes bright/white source images */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
            />
            {/* Bottom gradient fading into the panel background */}
            <div
              className="absolute inset-x-0 bottom-0 h-16"
              style={{ background: 'linear-gradient(to bottom, transparent, #0d0d0d)' }}
            />
          </div>
        )}
        {/* Title */}
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-term-primary leading-snug">
            {event.title}
          </div>
          <div className="flex gap-1 mt-1">
            <CopyBtn text={event.title} label="⊡ TITLE" />
            <CopyBtn text={JSON.stringify(detail ?? event, null, 2)} label="⊡ JSON" />
          </div>
        </div>

        {/* Metadata fields */}
        <div className="border border-term-border">
          <Field label="Published" value={formatDateCompact(event.date_published)} />
          {event.date_event && <Field label="Event" value={formatDateCompact(event.date_event)} />}
          <Field label="Source" value={'source_name' in event ? event.source_name : (detail?.source?.name ?? '—')} />
          {detail?.source?.provider && <Field label="Provider" value={detail.source.provider} />}
          {geoStr && (
            <Field label="Geo">
              <span className="break-all">{geoStr}</span>
              {geo?.lat != null && geo?.lon != null && (
                <>
                  {' '}
                  <a
                    href={`https://www.google.com/maps?q=${geo.lat},${geo.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-term-cyan hover:text-term-green transition-colors"
                  >
                    ↗ maps
                  </a>
                </>
              )}
            </Field>
          )}
          {confPct !== null && (
            <Field label="Conf">
              <span className="flex items-center gap-1.5">
                <span className="relative inline-block w-16 h-[2px] bg-term-border">
                  <span
                    className="absolute left-0 top-0 h-full bg-term-green"
                    style={{ width: `${confPct}%` }}
                  />
                </span>
                {confPct}%
              </span>
            </Field>
          )}
          {isLoading && (
            <Field label="Detail">
              <span className="text-term-yellow animate-pulse-green">loading…</span>
            </Field>
          )}
        </div>

        {/* Topics */}
        {event.topics.length > 0 && (
          <div>
            <div className="text-[7px] text-term-dim tracking-widest mb-1">TOPICS</div>
            <div className="flex flex-wrap gap-1">
              {event.topics.map(t => (
                <span
                  key={t}
                  className="text-[7px] px-1.5 py-px border border-term-border text-term-secondary"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div>
          <div className="text-[7px] text-term-dim tracking-widest mb-1">SUMMARY</div>
          <p className="text-[8px] text-term-secondary leading-relaxed">{event.summary}</p>
        </div>

        {/* Full contents */}
        {contents && (
          <div>
            <div className="text-[7px] text-term-dim tracking-widest mb-2 flex items-center gap-2">
              <span>FULL REPORT</span>
              <CopyBtn text={contents} label="⊡ COPY" />
            </div>
            <div className="evt-contents">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{contents}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Source images */}
        {detail?.image_urls && detail.image_urls.length > 0 && (
          <div>
            <div className="text-[7px] text-term-dim tracking-widest mb-1">
              IMAGES ({detail.image_urls.length})
            </div>
            <div className="flex flex-col gap-1">
              {detail.image_urls.slice(0, 3).map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[8px] text-term-cyan hover:text-term-green transition-colors truncate"
                >
                  ↗ {url.split('/').pop() ?? url}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {links.length > 0 && (
          <div>
            <div className="text-[7px] text-term-dim tracking-widest mb-1">
              SOURCES ({links.length})
            </div>
            <div className="space-y-0.5">
              {links.map((link, i) => (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[8px] text-term-cyan hover:text-term-green transition-colors flex-1 min-w-0 truncate"
                  >
                    ↗ {link.label ?? getDomainFromUrl(link.url)}
                  </a>
                  <CopyBtn text={link.url} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
