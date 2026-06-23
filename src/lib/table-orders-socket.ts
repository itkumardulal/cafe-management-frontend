import type { Socket } from 'socket.io-client';
import { fetchSocketToken } from './fetch-socket-token';
import {
  TABLE_ORDERS_SOCKET_EVENTS,
  type TableOrdersConnectionStatus,
  type TableOrdersRealtimePayload,
  getSocketOrigin,
} from './table-orders-realtime';

type Listener = {
  onBoardChanged?: (payload: TableOrdersRealtimePayload) => void;
  onSessionChanged?: (payload: TableOrdersRealtimePayload) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onStatusChange?: (status: TableOrdersConnectionStatus) => void;
};

class TableOrdersSocketManager {
  private socket: Socket | null = null;
  private refCount = 0;
  private connectGeneration = 0;
  private ioFactory: typeof import('socket.io-client').io | null = null;
  private listeners = new Set<Listener>();

  private setStatus(status: TableOrdersConnectionStatus) {
    for (const listener of this.listeners) {
      listener.onStatusChange?.(status);
    }
  }

  private notifyConnect() {
    for (const listener of this.listeners) {
      listener.onConnect?.();
    }
  }

  private notifyDisconnect() {
    for (const listener of this.listeners) {
      listener.onDisconnect?.();
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async acquire() {
    this.refCount += 1;
    if (this.refCount === 1) {
      await this.connect();
    }
    return () => this.release();
  }

  private release() {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0) {
      this.disconnect();
    }
  }

  private async connect() {
    if (this.socket?.connected) {
      return;
    }

    const generation = ++this.connectGeneration;
    this.setStatus('connecting');

    if (!this.ioFactory) {
      const mod = await import('socket.io-client');
      if (generation !== this.connectGeneration) {
        return;
      }
      this.ioFactory = mod.io;
    }

    const token = await fetchSocketToken();
    if (generation !== this.connectGeneration) {
      return;
    }
    if (!token) {
      this.setStatus('disconnected');
      return;
    }

    const socket = this.ioFactory(`${getSocketOrigin()}/table-orders`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    });

    if (generation !== this.connectGeneration) {
      socket.removeAllListeners();
      socket.disconnect();
      return;
    }

    socket.on('connect', () => {
      if (generation !== this.connectGeneration) {
        return;
      }
      this.setStatus('connected');
      this.notifyConnect();
    });

    socket.on('disconnect', () => {
      if (generation !== this.connectGeneration) {
        return;
      }
      this.setStatus('disconnected');
      this.notifyDisconnect();
    });

    socket.on('connect_error', () => {
      if (generation !== this.connectGeneration) {
        return;
      }
      this.setStatus('disconnected');
      void fetchSocketToken().then((fresh) => {
        if (fresh && this.socket === socket) {
          socket.auth = { token: fresh };
        }
      });
    });

    socket.on(
      TABLE_ORDERS_SOCKET_EVENTS.boardChanged,
      (payload: TableOrdersRealtimePayload) => {
        for (const listener of this.listeners) {
          listener.onBoardChanged?.(payload);
        }
      },
    );

    socket.on(
      TABLE_ORDERS_SOCKET_EVENTS.sessionChanged,
      (payload: TableOrdersRealtimePayload) => {
        for (const listener of this.listeners) {
          listener.onSessionChanged?.(payload);
        }
      },
    );

    this.socket = socket;
  }

  private disconnect() {
    this.connectGeneration += 1;
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.setStatus('disconnected');
  }
}

export const tableOrdersSocketManager = new TableOrdersSocketManager();
