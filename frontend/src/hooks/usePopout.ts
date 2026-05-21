import { useCallback, useEffect, useRef } from 'react';
import type { PanelId } from '../types';
import { PANEL_DEFAULTS } from '../types';

const CLOSE_POLL_MS = 500;

export interface UsePopoutOptions {
  /** Called when a popup blocker prevents window.open from succeeding. */
  onBlocked?: (panel: PanelId) => void;
  /** Called when a popout window is closed (by user or polling). */
  onClosed?: (panel: PanelId) => void;
}

export interface UsePopoutReturn {
  /** Open (or focus if already open) a popout window for the given panel. */
  open: (panel: PanelId) => void;
  /** Close a specific popout window and clean up. */
  close: (panel: PanelId) => void;
  /** Close all popout windows (e.g. on parent beforeunload). */
  closeAll: () => void;
  /** Whether a given panel is currently popped out. */
  isOpen: (panel: PanelId) => boolean;
}

/**
 * Manages popout window lifecycle for individual panels.
 *
 * - Per-panel default window sizes from PANEL_DEFAULTS.
 * - Duplicate prevention: re-focuses an existing window instead of opening a new one.
 * - Popup blocker detection via onBlocked callback.
 * - Close polling every 500 ms to detect user-closed windows.
 * - Parent beforeunload cleanup via closeAll.
 * - popIn action handling: child sends popIn → parent calls close(panel).
 * - Opens URL with hash `#popout=<panel>` so PopoutHost knows what to render.
 */
export function usePopout(options: UsePopoutOptions = {}): UsePopoutReturn {
  const windowsRef = useRef<Map<PanelId, Window>>(new Map());
  const pollersRef = useRef<Map<PanelId, ReturnType<typeof setInterval>>>(new Map());

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Clean up a single panel's poller + window ref.
  const cleanup = useCallback((panel: PanelId) => {
    const poller = pollersRef.current.get(panel);
    if (poller) {
      clearInterval(poller);
      pollersRef.current.delete(panel);
    }
    windowsRef.current.delete(panel);
  }, []);

  const close = useCallback((panel: PanelId) => {
    const win = windowsRef.current.get(panel);
    if (win && !win.closed) {
      win.close();
    }
    cleanup(panel);
    optionsRef.current.onClosed?.(panel);
  }, [cleanup]);

  const closeAll = useCallback(() => {
    for (const panel of Array.from(windowsRef.current.keys())) {
      close(panel);
    }
  }, [close]);

  const isOpen = useCallback((panel: PanelId): boolean => {
    const win = windowsRef.current.get(panel);
    return win != null && !win.closed;
  }, []);

  const open = useCallback((panel: PanelId) => {
    // Duplicate prevention: focus existing window if still open.
    const existing = windowsRef.current.get(panel);
    if (existing && !existing.closed) {
      existing.focus();
      return;
    }

    const { width, height } = PANEL_DEFAULTS[panel];
    const left = window.screenX + 80;
    const top = window.screenY + 80;
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;

    const url = `${window.location.origin}${window.location.pathname}#popout=${panel}`;
    const win = window.open(url, `osint-popout-${panel}`, features);

    // Popup blocker detection.
    if (!win || win.closed) {
      optionsRef.current.onBlocked?.(panel);
      return;
    }

    windowsRef.current.set(panel, win);

    // Poll for close: detect when the user closes the popout window externally.
    const poller = setInterval(() => {
      if (win.closed) {
        cleanup(panel);
        optionsRef.current.onClosed?.(panel);
      }
    }, CLOSE_POLL_MS);
    pollersRef.current.set(panel, poller);
  }, [cleanup]);

  // Close all popout windows when the parent tab unloads.
  useEffect(() => {
    const handleBeforeUnload = () => closeAll();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      closeAll();
    };
  }, [closeAll]);

  return { open, close, closeAll, isOpen };
}

// ── Helpers ──────────────────────────────────────────────────

/** Parse the URL hash to determine which panel a popout window should render. */
export function getPopoutPanel(): PanelId | null {
  const hash = window.location.hash; // e.g. "#popout=map"
  const match = hash.match(/^#popout=(\w+)$/);
  if (!match) return null;
  const id = match[1] as PanelId;
  return id in PANEL_DEFAULTS ? id : null;
}
