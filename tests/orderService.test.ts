import { jest } from '@jest/globals';
import { submitMarketOrder } from '../src/services/orderService';
import { createOrderRecord } from '../src/repositories/orderRepository';
import { orderQueue } from '../src/queue/orderQueue';

jest.mock('../src/repositories/orderRepository', () => ({
  createOrderRecord: jest.fn(),
}));

jest.mock('../src/queue/orderQueue', () => ({
  orderQueue: {
    add: jest.fn(),
  },
}));

describe('Order Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates payload schema', async () => {
    await expect(
      submitMarketOrder({
        orderType: 'market',
        baseMint: '',
        quoteMint: 'USDC',
        side: 'buy',
        amount: 1,
      }),
    ).rejects.toThrow();
  });

  it('creates an order record', async () => {
    await submitMarketOrder({
      orderType: 'market',
      baseMint: 'SOL',
      quoteMint: 'USDC',
      side: 'buy',
      amount: 2,
    });
    expect(createOrderRecord).toHaveBeenCalledTimes(1);
  });

  it('enqueues a job with orderId key', async () => {
    const result = await submitMarketOrder({
      orderType: 'market',
      baseMint: 'SOL',
      quoteMint: 'USDC',
      side: 'sell',
      amount: 0.5,
    });

    expect(orderQueue.add).toHaveBeenCalledWith(
      result.orderId,
      expect.objectContaining({ orderId: result.orderId }),
      expect.objectContaining({ jobId: result.orderId }),
    );
  });

  it('defaults slippage when not provided', async () => {
    await submitMarketOrder({
      orderType: 'market',
      baseMint: 'SOL',
      quoteMint: 'USDC',
      side: 'buy',
      amount: 1,
    });

    expect(orderQueue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ slippageBps: 250 }),
      expect.any(Object),
    );
  });
});


