import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const pool = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  database: env.PGDATABASE,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  max: 10,
});

pool.on('error', (error) => {
  logger.error({ error }, 'Unexpected Postgres error');
});

export const runMigrations = async () => {
  await pool.query(`
    create table if not exists orders (
      id uuid primary key,
      order_type text not null,
      base_mint text not null,
      quote_mint text not null,
      side text not null,
      amount numeric not null,
      status text not null,
      routed_venue text,
      tx_hash text,
      failure_reason text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  `);
};


