import React from 'react';

interface ShortcutsHelpProps {
  onClose: () => void;
}

const shortcuts: [string, string][] = [
  ['/', 'Focus search'],
  ['Esc', 'Clear / close'],
  ['J / ↓', 'Next result'],
  ['K / ↑', 'Previous result'],
  ['Enter', 'Open event detail'],
  ['M', 'Toggle map / detail pane'],
  ['T', 'Toggle timeline view'],
  ['C', 'Copy selected event JSON'],
  ['S', 'Save current search'],
  ['F', 'Toggle filter rail'],
  ['R', 'Reset search + filters'],
  ['?', 'Show this help'],
];

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-term-surface border border-term-border-hi w-80 animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-term-border">
          <span className="text-[9px] text-term-green font-mono font-semibold tracking-widest">
            KEYBOARD SHORTCUTS
          </span>
          <button
            onClick={onClose}
            className="text-term-secondary hover:text-term-primary text-[10px] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Shortcuts table */}
        <div className="px-3 py-2">
          {shortcuts.map(([key, desc]) => (
            <div key={key} className="flex items-center gap-3 py-1 border-b border-term-border last:border-0">
              <kbd className="flex-shrink-0 w-20 text-[8px] text-term-cyan font-mono">
                {key}
              </kbd>
              <span className="text-[8px] text-term-secondary font-mono">{desc}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-term-border text-center">
          <span className="text-[7px] text-term-dim font-mono">Press ? or Esc to close</span>
        </div>
      </div>
    </div>
  );
};
