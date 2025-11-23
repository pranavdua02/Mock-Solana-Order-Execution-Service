import { pool } from '../db/postgres';

export type OrderRecord = {
  id: string;
  order_type: string;
  base_mint: string;
  quote_mint: string;
  side: 'buy' | 'sell';
  amount: number;
  status: string;
  routed_venue?: string | null;
  tx_hash?: string | null;
  failure_reason?: string | null;
};

export const createOrderRecord = async (order: Omit<OrderRecord, 'status'> & { status?: string }) => {
  await pool.query(
    `insert into orders (
      id, order_type, base_mint, quote_mint, side, amount, status, routed_venue, tx_hash, failure_reason
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      order.id,
      order.order_type,
      order.base_mint,
      order.quote_mint,
      order.side,
      order.amount,
      order.status ?? 'pending',
      order.routed_venue ?? null,
      order.tx_hash ?? null,
      order.failure_reason ?? null,
    ],
  );
};

export const appendStatus = async (id: string, status: string) => {
  await pool.query(`update orders set status = $2, updated_at = now() where id = $1`, [id, status]);
};

export const recordRouting = async (id: string, venue: string) => {
  await pool.query(`update orders set routed_venue = $2, updated_at = now() where id = $1`, [id, venue]);
};

export const recordSuccess = async (id: string, txHash: string) => {
  await pool.query(`update orders set status = 'confirmed', tx_hash = $2, updated_at = now() where id = $1`, [
    id,
    txHash,
  ]);
};

export const recordFailure = async (id: string, reason: string) => {
  await pool.query(
    `update orders set status = 'failed', failure_reason = $2, updated_at = now() where id = $1`,
    [id, reason],
  );
};


