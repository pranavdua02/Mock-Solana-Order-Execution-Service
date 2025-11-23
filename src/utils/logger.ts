import pino from 'pino';
import { env } from '../config/env';

const level = env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = pino({
  level,
  transport: env.NODE_ENV === 'production'
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      },
});


