import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(4000),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  PGHOST: z.string().default('localhost'),
  PGPORT: z.coerce.number().int().default(5432),
  PGDATABASE: z.string().default('orders'),
  PGUSER: z.string().default('postgres'),
  PGPASSWORD: z.string().default('postgres'),
  ORDER_QUEUE_NAME: z.string().default('order-execution'),
  ORDER_MAX_CONCURRENCY: z.coerce.number().int().min(1).max(50).default(10),
  ORDER_MAX_PER_MINUTE: z.coerce.number().int().min(1).default(100),
  WS_HEARTBEAT_INTERVAL_MS: z.coerce.number().int().min(1000).default(10000),
  DEX_ROUTE_DELAY_MS: z.coerce.number().int().min(500).default(2000),
  DEX_PRICE_VARIATION_BPS: z.coerce.number().int().min(50).max(1000).default(250),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;


