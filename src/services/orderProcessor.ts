import { DexRouter } from './dexRouter';
import { OrderStatus } from '../types/order';
import { appendStatus, recordRouting, recordSuccess } from '../repositories/orderRepository';
import { delay } from '../utils/delay';
import { OrderStream } from '../websocket/orderStream';

type JobData = {
  orderId: string;
  baseMint: string;
  quoteMint: string;
  amount: number;
};

type Dependencies = {
  router: DexRouter;
  stream: OrderStream;
};

const emitStatus = async (
  orderId: string,
  status: OrderStatus,
  detail: Record<string, unknown> | undefined,
  stream: OrderStream,
) => {
  await appendStatus(orderId, status);
  stream.emit(orderId, { status, detail });
};

export const processOrderLifecycle = async (data: JobData, deps: Dependencies) => {
  const { router, stream } = deps;
  await emitStatus(data.orderId, 'routing', undefined, stream);
  const route = await router.getBestRoute(data.baseMint, data.quoteMint, data.amount);
  await recordRouting(data.orderId, route.venue);

  await emitStatus(data.orderId, 'building', { venue: route.venue, quotes: route.quotes }, stream);
  await delay(1_000);

  await emitStatus(data.orderId, 'submitted', { txHash: route.txHash }, stream);
  await delay(1_000);

  await recordSuccess(data.orderId, route.txHash);
  await emitStatus(
    data.orderId,
    'confirmed',
    {
      txHash: route.txHash,
      executionPrice: route.price,
      venue: route.venue,
    },
    stream,
  );

  return route;
};


