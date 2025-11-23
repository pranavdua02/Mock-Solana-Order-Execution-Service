import { jest } from '@jest/globals';
import { processOrderLifecycle } from '../src/services/orderProcessor';
import { DexRouter } from '../src/services/dexRouter';
import { OrderStream } from '../src/websocket/orderStream';
import { appendStatus, recordRouting, recordSuccess } from '../src/repositories/orderRepository';

jest.mock('../src/repositories/orderRepository', () => ({
  appendStatus: jest.fn(),
  recordRouting: jest.fn(),
  recordSuccess: jest.fn(),
}));

jest.mock('../src/utils/delay', () => ({
  delay: () => Promise.resolve(),
}));

describe('Order Processor', () => {
  const routeResult = {
    venue: 'raydium' as const,
    price: 101,
    quotes: [
      { venue: 'raydium' as const, price: 101, liquidity: 100 },
      { venue: 'meteora' as const, price: 99, liquidity: 120 },
    ],
    txHash: '0x1234abcd1234abcd1234abcd1234abcd',
  };

  const router = {
    getBestRoute: jest.fn().mockResolvedValue(routeResult),
  } as unknown as DexRouter;

  const emits: Array<{ orderId: string; status: string }> = [];
  const stream = {
    emit: (orderId: string, payload: { status: string }) => {
      emits.push({ orderId, status: payload.status });
    },
  } as unknown as OrderStream;

  beforeEach(() => {
    jest.clearAllMocks();
    emits.length = 0;
  });

  it('emits every stage in order', async () => {
    await processOrderLifecycle(
      { orderId: 'order-1', baseMint: 'SOL', quoteMint: 'USDC', amount: 1 },
      { router, stream },
    );

    expect(emits.map((e) => e.status)).toEqual(['routing', 'building', 'submitted', 'confirmed']);
  });

  it('records routing metadata', async () => {
    await processOrderLifecycle(
      { orderId: 'order-2', baseMint: 'SOL', quoteMint: 'USDC', amount: 1 },
      { router, stream },
    );

    expect(recordRouting).toHaveBeenCalledWith('order-2', 'raydium');
  });

  it('records success with transaction hash', async () => {
    await processOrderLifecycle(
      { orderId: 'order-3', baseMint: 'SOL', quoteMint: 'USDC', amount: 1 },
      { router, stream },
    );

    expect(recordSuccess).toHaveBeenCalledWith('order-3', routeResult.txHash);
  });

  it('returns routing payload', async () => {
    const result = await processOrderLifecycle(
      { orderId: 'order-4', baseMint: 'SOL', quoteMint: 'USDC', amount: 1 },
      { router, stream },
    );

    expect(result).toEqual(routeResult);
  });
});


