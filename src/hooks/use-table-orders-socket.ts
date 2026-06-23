import { useEffect, useRef, useState } from 'react';
import {
  debounce,
  type TableOrdersConnectionStatus,
  type TableOrdersRealtimePayload,
} from '@/src/lib/table-orders-realtime';
import { shouldSkipTableOrdersSocketRefetch } from '@/src/lib/table-orders-refetch-guard';
import { tableOrdersSocketManager } from '@/src/lib/table-orders-socket';

type Options = {
  enabled?: boolean;
  sessionId?: string | null;
  onBoardChanged: () => void;
  onSessionChanged?: (sessionId: string) => void;
  onReconnect?: () => void;
};

export function useTableOrdersSocket({
  enabled = true,
  sessionId,
  onBoardChanged,
  onSessionChanged,
  onReconnect,
}: Options) {
  const [connectionStatus, setConnectionStatus] =
    useState<TableOrdersConnectionStatus>(() =>
      enabled ? 'connecting' : 'disconnected',
    );

  const onBoardChangedRef = useRef(onBoardChanged);
  const onSessionChangedRef = useRef(onSessionChanged);
  const onReconnectRef = useRef(onReconnect);
  const sessionIdRef = useRef(sessionId);

  onBoardChangedRef.current = onBoardChanged;
  onSessionChangedRef.current = onSessionChanged;
  onReconnectRef.current = onReconnect;
  sessionIdRef.current = sessionId;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const debouncedBoard = debounce(() => {
      if (shouldSkipTableOrdersSocketRefetch()) return;
      onBoardChangedRef.current();
    }, 300);

    const debouncedSession = debounce((payload: TableOrdersRealtimePayload) => {
      if (shouldSkipTableOrdersSocketRefetch()) return;
      if (payload.sessionId && payload.sessionId === sessionIdRef.current) {
        onSessionChangedRef.current?.(payload.sessionId);
      }
    }, 300);

    const unsubscribe = tableOrdersSocketManager.subscribe({
      onStatusChange: setConnectionStatus,
      onBoardChanged: () => debouncedBoard(),
      onSessionChanged: (payload) => debouncedSession(payload),
      onConnect: () => onReconnectRef.current?.(),
      onDisconnect: () => setConnectionStatus('disconnected'),
    });

    let release: (() => void) | undefined;
    void tableOrdersSocketManager.acquire().then((releaseFn) => {
      release = releaseFn;
    });

    return () => {
      unsubscribe();
      release?.();
    };
  }, [enabled]);

  return { connectionStatus };
}
