-- Order Execution Engine Database Schema
-- Run this script to initialize the database

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  order_type TEXT NOT NULL,
  base_mint TEXT NOT NULL,
  quote_mint TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL,
  routed_venue TEXT,
  tx_hash TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_routed_venue ON orders(routed_venue);

-- Status history tracking (optional, for audit trail)
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  detail JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_order_id ON order_status_history(order_id, created_at DESC);

