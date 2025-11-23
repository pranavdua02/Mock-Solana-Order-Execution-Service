import { env } from '../config/env';
import { delay } from '../utils/delay';
import { logger } from '../utils/logger';

export type DexVenue = 'raydium' | 'meteora';

export interface Quote {
  venue: DexVenue;
  price: number;
  liquidity: number;
}

const basePrices: Record<string, number> = {
  SOL: 100,
  USDC: 1,
  BONK: 0.00002,
};

const randomTxHash = () => `0x${crypto.randomUUID().replace(/-/g, '')}`;

export class DexRouter {
  constructor(private readonly priceVariationBps = env.DEX_PRICE_VARIATION_BPS) {}

  private getBasePrice(baseMint: string): number {
    return basePrices[baseMint] ?? 5;
  }

  private simulateQuote(venue: DexVenue, baseMint: string, amount: number): Quote {
    const basePrice = this.getBasePrice(baseMint);
    const variation = (Math.random() * this.priceVariationBps) / 10_000;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const price = basePrice * (1 + variation * direction);
    const liquidity = amount * (1 + Math.random());
    return { venue, price, liquidity };
  }

  async getBestRoute(baseMint: string, quoteMint: string, amount: number) {
    logger.debug({ baseMint, quoteMint, amount }, 'Fetching DEX quotes');
    await delay(env.DEX_ROUTE_DELAY_MS);

    const raydium = this.simulateQuote('raydium', baseMint, amount);
    const meteora = this.simulateQuote('meteora', baseMint, amount);
    const quotes = [raydium, meteora];

    const best = quotes.reduce((prev, current) =>
      current.price > prev.price ? current : prev,
    );

    logger.info(
      { quotes, selected: best },
      'DEX routing decision',
    );

    return {
      venue: best.venue,
      price: best.price,
      quotes,
      txHash: randomTxHash(),
    };
  }
}


