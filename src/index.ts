import Fastify from 'fastify';
import websocketPlugin from '@fastify/websocket';
import { env } from './config/env';
import { logger } from './utils/logger';
import { registerOrderRoutes } from './routes/orderRoute';
import { OrderStream } from './websocket/orderStream';
import { startOrderWorker } from './queue/orderWorker';
import { runMigrations } from './db/postgres';

const app = Fastify({
  logger,
});

const stream = new OrderStream();
const worker = startOrderWorker(stream);

export const buildServer = async () => {
  await app.register(websocketPlugin);
  await registerOrderRoutes(app, stream);
  return app;
};

export const start = async () => {
  await runMigrations();
  await buildServer();
  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info({ port: env.PORT }, 'Order execution engine ready');
};

const shutdown = async () => {
  logger.info('Shutting down gracefully');
  await worker.close();
  await app.close();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (process.env.NODE_ENV !== 'test') {
  start().catch((error) => {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  });
}

