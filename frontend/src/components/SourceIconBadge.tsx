import React from 'react';
import { SocialIcon } from 'react-social-icons';
import type { SourceIcon } from '../lib/utils';

interface SourceIconBadgeProps {
  icon: SourceIcon;
  /** Diameter in px for the social icon circle. Default 14. */
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Renders a compact source icon — a react-social-icons circle for known
 * social networks (Twitter/X, Telegram, Reddit, YouTube) or a colored
 * text badge for news outlets and other sources.
 */
export const SourceIconBadge: React.FC<SourceIconBadgeProps> = ({
  icon,
  size = 14,
  className,
  title,
}) => {
  if (icon.network) {
    return (
      <SocialIcon
        network={icon.network}
        as="span"
        style={{ width: size, height: size, cursor: 'inherit' }}
        tabIndex={-1}
        className={className}
        title={title}
        aria-hidden
      />
    );
  }

  // Text fallback for non-social sources.
  return (
    <span
      className={`flex-shrink-0 font-bold text-[7px] px-0.5 leading-none ${className ?? ''}`}
      style={{ color: icon.color }}
      title={title}
      aria-hidden
    >
      {icon.symbol}
    </span>
  );
};
