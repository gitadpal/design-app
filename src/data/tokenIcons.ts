// Public CDN map for the tokens that appear in the mock data. CoinCap serves
// stable PNGs keyed by lowercased symbol; unknown symbols (PIXP, SXT, AZ, W,
// ZK, CFG) return null and callers fall back to a tinted initial.
const COINCAP = (s: string) => `https://assets.coincap.io/assets/icons/${s.toLowerCase()}@2x.png`;

// Symbols verified to exist on the CoinCap icon CDN. Listing them explicitly
// avoids 404 noise on the fallback path.
const KNOWN = new Set([
  'btc', 'eth', 'bnb', 'sol', 'usdc', 'usdt', 'arb', 'op', 'aave', 'uni',
  'ldo', 'pyth', 'tia', 'gmx', 'sky', 'blur', 'dydx', 'pendle', 'eigen',
  'ena', 'okb',
]);

export function getTokenIconUrl(symbol: string): string | null {
  const key = symbol.toLowerCase().split(' ')[0];
  return KNOWN.has(key) ? COINCAP(key) : null;
}
