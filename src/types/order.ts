export type OrderSide = 'buy' | 'sell';

export type OrderStatus =
  | 'pending'
  | 'routing'
  | 'building'
  | 'submitted'
  | 'confirmed'
  | 'failed';

export interface MarketOrderPayload {
  orderType: 'market';
  baseMint: string;
  quoteMint: string;
  side: OrderSide;
  amount: number;
  slippageBps?: number;
}

export interface ExecutionResult {
  orderId: string;
  venue: 'raydium' | 'meteora';
  executionPrice: number;
  txHash: string;
}


