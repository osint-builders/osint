import React, { useState, useCallback } from 'react';
import { copyToClipboard } from '../lib/utils';

export const CopyBtn: React.FC<{ text: string; label?: string }> = ({ text, label = '⊡' }) => {
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
