import { Queue, QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export type OrderJobData = {
  orderId: string;
  baseMint: string;
  quoteMint: string;
  side: 'buy' | 'sell';
  amount: number;
  slippageBps: number;
};

export const orderQueue = new Queue<OrderJobData>(env.ORDER_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
  limiter: {
    max: env.ORDER_MAX_PER_MINUTE,
    duration: 60_000,
  },
});

export const orderQueueEvents = new QueueEvents(env.ORDER_QUEUE_NAME, {
  connection: redisConnection.duplicate(),
});

orderQueueEvents.on('failed', (event) => {
  logger.error({ event }, 'Order job failed');
});

export type OrderWorker = Worker<OrderJobData>;


