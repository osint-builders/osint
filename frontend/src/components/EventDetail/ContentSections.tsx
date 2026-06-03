import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getDomainFromUrl } from '../../lib/utils';
import type { EventLink } from '../../types';
import { CopyBtn } from '../CopyBtn';

export const TopicsSection: React.FC<{ topics: string[] }> = ({ topics }) => {
  if (topics.length === 0) return null;
  return (
    <div>
      <div className="text-[7px] text-term-dim tracking-widest mb-1">TOPICS</div>
      <div className="flex flex-wrap gap-1">
        {topics.map(t => (
          <span
            key={t}
            className="text-[7px] px-1.5 py-px border border-term-border text-term-secondary"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

export const SummarySection: React.FC<{ summary: string }> = ({ summary }) => (
  <div>
    <div className="text-[7px] text-term-dim tracking-widest mb-1">SUMMARY</div>
    <p className="text-[8px] text-term-secondary leading-relaxed">{summary}</p>
  </div>
);

export const FullContentsSection: React.FC<{ contents: string }> = ({ contents }) => (
  <div>
    <div className="text-[7px] text-term-dim tracking-widest mb-2 flex items-center gap-2">
      <span>FULL REPORT</span>
      <CopyBtn text={contents} label="⊡ COPY" />
    </div>
    <div className="evt-contents">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{contents}</ReactMarkdown>
    </div>
  </div>
);

export const ImagesSection: React.FC<{ imageUrls: string[] }> = ({ imageUrls }) => {
  if (imageUrls.length === 0) return null;
  return (
    <div>
      <div className="text-[7px] text-term-dim tracking-widest mb-1">
        IMAGES ({imageUrls.length})
      </div>
      <div className="flex flex-col gap-1">
        {imageUrls.slice(0, 3).map((url, i) => (
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
  );
};

export const LinksSection: React.FC<{ links: EventLink[] }> = ({ links }) => {
  if (links.length === 0) return null;
  return (
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
  );
};
