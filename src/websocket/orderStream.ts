import type { SocketStream } from '@fastify/websocket';
import { env } from '../config/env';
import { logger } from '../utils/logger';

type OrderListener = {
  socket: SocketStream;
  heartbeat: NodeJS.Timeout;
};

export class OrderStream {
  private readonly listeners = new Map<string, Set<OrderListener>>();
  constructor(private readonly heartbeatInterval = env.WS_HEARTBEAT_INTERVAL_MS) {}

  register(orderId: string, socket: SocketStream) {
    const listener: OrderListener = {
      socket,
      heartbeat: setInterval(() => {
        if (socket.socket.readyState === socket.socket.OPEN) {
          socket.socket.ping();
        }
      }, this.heartbeatInterval),
    };

    const current = this.listeners.get(orderId) ?? new Set<OrderListener>();
    current.add(listener);
    this.listeners.set(orderId, current);

    socket.socket.on('close', () => {
      this.remove(orderId, listener);
    });

    socket.on('error', (error) => {
      logger.error({ orderId, error }, 'WebSocket error');
      this.remove(orderId, listener);
    });

    logger.info({ orderId }, 'WebSocket listener registered');
  }

  emit(orderId: string, event: { status: string; detail?: Record<string, unknown> }) {
    const listeners = this.listeners.get(orderId);
    if (!listeners?.size) return;

    const payload = JSON.stringify({
      orderId,
      status: event.status,
      detail: event.detail,
      ts: new Date().toISOString(),
    });

    listeners.forEach(({ socket }) => {
      if (socket.socket.readyState === socket.socket.OPEN) {
        socket.socket.send(payload);
      }
    });
  }

  private remove(orderId: string, listener: OrderListener) {
    clearInterval(listener.heartbeat);
    const listeners = this.listeners.get(orderId);
    listeners?.delete(listener);
    if (!listeners || listeners.size === 0) {
      this.listeners.delete(orderId);
    }
  }
}

