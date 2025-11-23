import { DexRouter } from '../src/services/dexRouter';

describe('DexRouter', () => {
  const router = new DexRouter(250);

  it('returns both Raydium and Meteora quotes', async () => {
    const result = await router.getBestRoute('SOL', 'USDC', 1);
    expect(result.quotes).toHaveLength(2);
    const venues = result.quotes.map((q) => q.venue).sort();
    expect(venues).toEqual(['meteora', 'raydium']);
  });

  it('selects the best quote by price', async () => {
    const route = await router.getBestRoute('SOL', 'USDC', 1);
    const highest = route.quotes.reduce((prev, curr) => (curr.price > prev.price ? curr : prev));
    expect(route.venue).toBe(highest.venue);
  });

  it('generates deterministic txHash format', async () => {
    const route = await router.getBestRoute('SOL', 'USDC', 1);
    expect(route.txHash).toMatch(/^0x[a-f0-9]{32}$/);
  });

  it('keeps prices within configured bounds', async () => {
    const route = await router.getBestRoute('SOL', 'USDC', 1);
    expect(route.price).toBeGreaterThan(70);
    expect(route.price).toBeLessThan(130);
  });
});


