import { useEffect, useRef, useCallback } from 'react';
import type { BroadcastMessage, PopoutSyncState, PopoutAction } from '../types';

const CHANNEL_NAME = 'osint-sync';

// ── Parent side ──────────────────────────────────────────────

/**
 * Parent hook: broadcasts state to popout children via BroadcastChannel,
 * throttled to one post per animation frame. Listens for child actions.
 */
export function useBroadcastParent(
  state: PopoutSyncState,
  onAction: (action: PopoutAction) => void,
) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const rafRef = useRef(0);
  const latestState = useRef(state);
  latestState.current = state;

  // Stable action handler ref to avoid re-subscribing on every render.
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;

    const handleMessage = (e: MessageEvent<BroadcastMessage>) => {
      if (e.data?.type === 'action') {
        onActionRef.current(e.data.payload);
      }
    };
    ch.addEventListener('message', handleMessage);

    return () => {
      ch.removeEventListener('message', handleMessage);
      ch.close();
      channelRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // rAF-throttled broadcast whenever state changes.
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      channelRef.current?.postMessage({
        type: 'state',
        payload: latestState.current,
      } satisfies BroadcastMessage);
    });
  }, [state]);
}

// ── Child side ───────────────────────────────────────────────

/**
 * Child hook: receives state snapshots from the parent and exposes a
 * dispatch function to send actions back.
 */
export function useBroadcastChild(
  onState: (state: PopoutSyncState) => void,
): (action: PopoutAction) => void {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;

    const handleMessage = (e: MessageEvent<BroadcastMessage>) => {
      if (e.data?.type === 'state') {
        onStateRef.current(e.data.payload);
      }
    };
    ch.addEventListener('message', handleMessage);

    return () => {
      ch.removeEventListener('message', handleMessage);
      ch.close();
      channelRef.current = null;
    };
  }, []);

  const dispatch = useCallback((action: PopoutAction) => {
    channelRef.current?.postMessage({
      type: 'action',
      payload: action,
    } satisfies BroadcastMessage);
  }, []);

  return dispatch;
}
