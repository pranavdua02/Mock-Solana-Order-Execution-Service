import { Worker } from 'bullmq';
import { env } from '../config/env';
import { DexRouter } from '../services/dexRouter';
import { recordFailure } from '../repositories/orderRepository';
import { redisConnection } from './orderQueue';
import { logger } from '../utils/logger';
import { OrderStream } from '../websocket/orderStream';
import { processOrderLifecycle } from '../services/orderProcessor';

const router = new DexRouter();

export const startOrderWorker = (stream: OrderStream) => {
  const worker = new Worker(
    env.ORDER_QUEUE_NAME,
    async (job) => {
      const { orderId, baseMint, quoteMint, amount } = job.data;
      const route = await processOrderLifecycle(
        {
          orderId,
          baseMint,
          quoteMint,
          amount,
        },
        { router, stream },
      );

      return { ...route, orderId };
    },
    {
      concurrency: env.ORDER_MAX_CONCURRENCY,
      connection: redisConnection.duplicate(),
    },
  );

  worker.on('failed', async (job, error) => {
    if (!job) return;
    const reason = error.message;
    const attempts = job.attemptsMade ?? 0;
    const maxAttempts = job.opts.attempts ?? 1;
    const isFinalAttempt = attempts >= maxAttempts;

    logger.error({ orderId: job.data.orderId, reason }, 'Order processing failed');
    stream.emit(job.data.orderId, {
      status: 'failed',
      detail: { reason, attempts },
    });

    if (isFinalAttempt) {
      await recordFailure(job.data.orderId, reason);
    }
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, orderId: job.data.orderId }, 'Order completed');
  });

  return worker;
};

