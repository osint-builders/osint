import React from 'react';
import { formatDateCompact } from '../../lib/utils';
import type { EventMetadata, EventDetail } from '../../types';

interface MetadataFieldsProps {
  event: EventMetadata | EventDetail;
  isLoading: boolean;
}

const Field: React.FC<{ label: string; value?: string; children?: React.ReactNode }> = ({
  label,
  value,
  children,
}) => (
  <div className="flex items-baseline gap-2 px-2 py-1 border-b border-term-border last:border-b-0 min-w-0">
    <span className="text-[7px] text-term-dim tracking-wider flex-shrink-0 w-16">{label}</span>
    <span className="text-[8px] text-term-secondary break-words flex-1 min-w-0">
      {children ?? value ?? '—'}
    </span>
  </div>
);

export const MetadataFields: React.FC<MetadataFieldsProps> = ({ event, isLoading }) => {
  const conf = event.confidence;
  const confPct = conf !== null ? Math.round(conf * 100) : null;
  const geo = event.geo;
  const geoStr = [geo?.city, geo?.region, geo?.country].filter(Boolean).join(', ');
  const detail = 'source' in event ? event : null;

  return (
    <div className="border border-term-border">
      <Field label="Published" value={formatDateCompact(event.date_published)} />
      {event.date_event && <Field label="Event" value={formatDateCompact(event.date_event)} />}
      <Field
        label="Source"
        value={'source_name' in event ? event.source_name : (detail?.source?.name ?? '—')}
      />
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
  );
};
