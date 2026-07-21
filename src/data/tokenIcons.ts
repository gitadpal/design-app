// Token icons are cached locally under public/tokens/ (keyed by lowercased
// symbol), sourced once from CoinCap. Serving them as static assets removes the
// runtime dependency on that CDN — an outage there would otherwise silently
// degrade every coin to a tinted initial. Unknown symbols return null and
// callers fall back to that initial (see web3/TokenLogo).
const LOCAL = (s: string) => `${import.meta.env.BASE_URL}tokens/${s}.png`;

// Symbols with a cached icon under public/tokens/.
const KNOWN = new Set([
  'btc', 'eth', 'bnb', 'sol', 'usdc', 'usdt', 'arb', 'op', 'aave', 'uni',
  'ldo', 'pyth', 'tia', 'sky', 'dydx', 'pendle', 'eigen', 'ena', 'okb',
]);

export function getTokenIconUrl(symbol: string): string | null {
  const key = symbol.toLowerCase().split(' ')[0];
  return KNOWN.has(key) ? LOCAL(key) : null;
}
