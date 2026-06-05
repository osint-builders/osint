import React from 'react';

interface DetailHeaderProps {
  eventId: string;
  onShowMap: () => void;
  onClose: () => void;
  onPopout?: () => void;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const handle = React.useCallback(() => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [text]);
  return (
    <button
      onClick={handle}
      className="text-[7px] text-term-dim hover:text-term-cyan transition-colors ml-1 flex-shrink-0"
      title="Copy"
    >
      {copied ? '✓' : '⊡'}
    </button>
  );
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({
  eventId,
  onShowMap,
  onClose,
  onPopout,
}) => (
  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-term-border flex-shrink-0">
    <span className="text-[8px] text-term-dim flex-1 truncate">
      {eventId}
      <CopyBtn text={eventId} />
    </span>
    {onPopout && (
      <button
        onClick={onPopout}
        className="text-[7px] text-term-dim hover:text-term-cyan transition-colors flex-shrink-0"
        aria-label="Open detail in new window"
        title="Pop out"
      >
        ⧉
      </button>
    )}
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
);
