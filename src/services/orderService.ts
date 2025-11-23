import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createOrderRecord } from '../repositories/orderRepository';
import { orderQueue } from '../queue/orderQueue';
import { MarketOrderPayload } from '../types/order';

const marketOrderSchema = z.object({
  orderType: z.literal('market'),
  baseMint: z.string().min(1),
  quoteMint: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  amount: z.number().positive(),
  slippageBps: z.number().int().positive().max(1000).default(250),
});

export const submitMarketOrder = async (payload: MarketOrderPayload) => {
  const body = marketOrderSchema.parse(payload);
  const orderId = randomUUID();

  await createOrderRecord({
    id: orderId,
    order_type: body.orderType,
    base_mint: body.baseMint,
    quote_mint: body.quoteMint,
    side: body.side,
    amount: body.amount,
    status: 'pending',
  });

  await orderQueue.add(
    orderId,
    {
      orderId,
      baseMint: body.baseMint,
      quoteMint: body.quoteMint,
      side: body.side,
      amount: body.amount,
      slippageBps: body.slippageBps,
    },
    {
      jobId: orderId,
    },
  );

  return { orderId };
};


