import React from 'react';
import type { EventDetail as EventDetailType, EventMetadata } from '../types';
import { CopyBtn } from './CopyBtn';
import { DetailHeader } from './EventDetail/DetailHeader';
import { MetadataFields } from './EventDetail/MetadataFields';
import {
  TopicsSection,
  SummarySection,
  FullContentsSection,
  ImagesSection,
  LinksSection,
} from './EventDetail/ContentSections';

interface EventDetailProps {
  metadata: EventMetadata | null;
  detail: EventDetailType | null;
  isLoading: boolean;
  onClose: () => void;
  onShowMap: () => void;
  onPopout?: () => void;
}

const PreviewBanner: React.FC<{ imageUrl: string }> = ({ imageUrl }) => (
  <div
    className="-mx-3 -mt-2 mb-1 relative h-[140px] flex-shrink-0 overflow-hidden"
    style={{
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }} />
    <div
      className="absolute inset-x-0 bottom-0 h-16"
      style={{ background: 'linear-gradient(to bottom, transparent, #0d0d0d)' }}
    />
  </div>
);

export const EventDetail: React.FC<EventDetailProps> = ({
  metadata,
  detail,
  isLoading,
  onClose,
  onShowMap,
  onPopout,
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

  const links = detail?.links ?? metadata?.links ?? [];
  const contents = detail?.contents;
  const previewImage = detail?.link_preview?.image ?? metadata?.link_preview_image ?? null;

  return (
    <div className="flex-1 flex flex-col min-h-0 border-l border-term-border bg-term-surface animate-slide-in">
      <DetailHeader
        eventId={event.id}
        onShowMap={onShowMap}
        onClose={onClose}
        onPopout={onPopout}
      />

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {previewImage && <PreviewBanner imageUrl={previewImage} />}

        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-term-primary leading-snug">
            {event.title}
          </div>
          <div className="flex gap-1 mt-1">
            <CopyBtn text={event.title} label="⊡ TITLE" />
            <CopyBtn text={JSON.stringify(detail ?? event, null, 2)} label="⊡ JSON" />
          </div>
        </div>

        <MetadataFields event={event} isLoading={isLoading} />
        <TopicsSection topics={event.topics} />
        <SummarySection summary={event.summary} />
        {contents && <FullContentsSection contents={contents} />}
        {detail?.image_urls && <ImagesSection imageUrls={detail.image_urls} />}
        <LinksSection links={links} />
      </div>
    </div>
  );
};
