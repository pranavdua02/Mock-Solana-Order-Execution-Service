import { EventEmitter } from 'events';
import { OrderStream } from '../src/websocket/orderStream';

const createMockSocket = () => {
  const emitter = new EventEmitter();
  const outerEmitter = new EventEmitter();
  const socket = {
    OPEN: 1,
    readyState: 1,
    sent: [] as string[],
    ping: jest.fn(),
    send(payload: string) {
      this.sent.push(payload);
    },
    close: jest.fn(),
    on: emitter.on.bind(emitter),
    emit: emitter.emit.bind(emitter),
  };
  return {
    socket,
    on: outerEmitter.on.bind(outerEmitter),
    emit: outerEmitter.emit.bind(outerEmitter),
  };
};

describe('OrderStream', () => {
  const sockets: Array<ReturnType<typeof createMockSocket>> = [];

  afterEach(() => {
    sockets.forEach((sock) => {
      sock.socket.emit('close');
    });
    sockets.length = 0;
  });

  it('delivers status updates to registered sockets', () => {
    const stream = new OrderStream(50);
    const socket = createMockSocket();
    sockets.push(socket);
    // @ts-expect-error - minimal socket stub
    stream.register('order-a', socket);

    stream.emit('order-a', { status: 'routing' });

    expect(socket.socket.sent).toHaveLength(1);
    expect(JSON.parse(socket.socket.sent[0]).status).toBe('routing');
  });

  it('removes sockets after close', () => {
    const stream = new OrderStream(50);
    const socket = createMockSocket();
    sockets.push(socket);
    // @ts-expect-error - minimal socket stub
    stream.register('order-b', socket);

    socket.socket.emit('close');
    stream.emit('order-b', { status: 'routing' });

    expect(socket.socket.sent).toHaveLength(0);
  });

  it('sends heartbeat pings on interval', async () => {
    const stream = new OrderStream(5);
    const socket = createMockSocket();
    sockets.push(socket);
    // @ts-expect-error - minimal socket stub
    stream.register('order-c', socket);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(socket.socket.ping).toHaveBeenCalled();
  });
});

