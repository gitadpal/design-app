// Formats a per-cast reward so the number always reads as "a lot."
//
// Strategy:
//   • Sub-1 amounts get bumped to the nearest smaller SI unit (m/μ/n), so
//     0.30 USDC becomes 300 mUSDC and 0.0002 ETH becomes 200 μETH.
//   • Amounts ≥ 1000 collapse to K/M/B, with the scale letter returned
//     separately so the caller can render it prominently next to the
//     number (e.g. "10" big, "K" big and colored, "USDC" small).
//   • Symbols that are already at the smallest practical unit (sats, wei,
//     gwei) skip the m/μ step — there's no smaller unit to escalate to.
//
// Returns the parts split apart so the caller can style each separately
// AND look up the base symbol for token-logo rendering:
//   value   — the numeric portion as a display string
//   scale   — optional K/M/B letter that should sit big next to value
//   prefix  — optional m/μ/n letter that prepends the symbol
//   symbol  — the unprefixed base symbol (e.g. "USDC"), suitable for
//             passing to logo lookups
//
// Callers typically render `${value}${scale ?? ''}` as one block and
// `${prefix ?? ''}${symbol}` as the smaller ticker beside / below it.

const SMALLEST_UNIT_SYMBOLS = new Set(['sats', 'wei', 'gwei']);

export interface FormattedPayout {
  value: string;
  scale?: 'K' | 'M' | 'B';
  prefix?: 'm' | 'μ' | 'n';
  symbol: string;
}

export function formatPayout(amount: number, symbol: string): FormattedPayout {
  if (!isFinite(amount) || amount <= 0) {
    return { value: '0', symbol };
  }

  // Large amounts → K/M/B with the scale letter promoted.
  if (amount >= 1_000_000_000) {
    return { value: trimZero(amount / 1_000_000_000), scale: 'B', symbol };
  }
  if (amount >= 1_000_000) {
    return { value: trimZero(amount / 1_000_000), scale: 'M', symbol };
  }
  if (amount >= 1_000) {
    return { value: trimZero(amount / 1_000), scale: 'K', symbol };
  }

  // In-range, or a symbol that's already the smallest unit.
  if (amount >= 1 || SMALLEST_UNIT_SYMBOLS.has(symbol)) {
    return { value: trimZero(amount), symbol };
  }

  // Sub-1: escalate to the smallest SI prefix that produces a value ≥ 1.
  if (amount >= 0.001) {
    return { value: trimZero(amount * 1_000), prefix: 'm', symbol };
  }
  if (amount >= 0.000_001) {
    return { value: trimZero(amount * 1_000_000), prefix: 'μ', symbol };
  }
  return { value: trimZero(amount * 1_000_000_000), prefix: 'n', symbol };
}

// Two significant decimals max; strip trailing zeros and any dangling dot.
function trimZero(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, '');
}
