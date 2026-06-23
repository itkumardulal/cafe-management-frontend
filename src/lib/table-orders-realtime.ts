export type TableOrdersConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export type TableOrdersRealtimePayload = {
  cafeId: string;
  sessionId?: string;
  reason: string;
  at: string;
};

export const TABLE_ORDERS_SOCKET_EVENTS = {
  boardChanged: 'table-orders:board-changed',
  sessionChanged: 'table-orders:session-changed',
} as const;

/** NestJS host for Socket.io (not the Next.js /api proxy origin). */
export function getSocketOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  const appOrigin = apiUrl.replace(/\/api\/?$/, '');

  try {
    const url = new URL(appOrigin);
    if (url.hostname === 'localhost' && url.port === '3000') {
      return 'http://localhost:4000';
    }
  } catch {
    // fall through
  }

  return appOrigin;
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, waitMs);
  };
}
