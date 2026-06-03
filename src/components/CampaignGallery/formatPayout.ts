// Formats a per-cast reward so the number always reads as "a lot."
//
// Strategy:
//   • Sub-1 amounts get bumped to the nearest smaller SI unit (m/μ/n), so
//     0.30 USDC becomes 300 mUSDC and 0.0002 ETH becomes 200 μETH.
//   • Amounts ≥ 1000 collapse to K/M, with the scale letter returned
//     separately so the caller can render it prominently next to the number
//     (e.g. "10" big, "K" big, "USDC" small).
//   • Symbols that are already at the smallest practical unit (sats, wei,
//     gwei) skip the m/μ step — there's no smaller unit to escalate to.
//
// Returns the parts split apart so the caller can style each:
//   value   — the numeric portion as a display string
//   scale   — optional K/M letter that should sit big next to value
//   unit    — the (possibly prefixed) token symbol, e.g. "mUSDC" or "USDC"

const SMALLEST_UNIT_SYMBOLS = new Set(['sats', 'wei', 'gwei']);

export interface FormattedPayout {
  value: string;
  scale?: 'K' | 'M' | 'B';
  unit: string;
}

export function formatPayout(amount: number, symbol: string): FormattedPayout {
  if (!isFinite(amount) || amount <= 0) {
    return { value: '0', unit: symbol };
  }

  // Large amounts → K/M/B with the scale letter promoted.
  if (amount >= 1_000_000_000) {
    return { value: trimZero(amount / 1_000_000_000), scale: 'B', unit: symbol };
  }
  if (amount >= 1_000_000) {
    return { value: trimZero(amount / 1_000_000), scale: 'M', unit: symbol };
  }
  if (amount >= 1_000) {
    return { value: trimZero(amount / 1_000), scale: 'K', unit: symbol };
  }

  // In-range, or a symbol that's already the smallest unit.
  if (amount >= 1 || SMALLEST_UNIT_SYMBOLS.has(symbol)) {
    return { value: trimZero(amount), unit: symbol };
  }

  // Sub-1: escalate to the smallest SI prefix that produces a value ≥ 1.
  if (amount >= 0.001) {
    return { value: trimZero(amount * 1_000), unit: 'm' + symbol };
  }
  if (amount >= 0.000_001) {
    return { value: trimZero(amount * 1_000_000), unit: 'μ' + symbol };
  }
  return { value: trimZero(amount * 1_000_000_000), unit: 'n' + symbol };
}

// Two significant decimals max; strip trailing zeros and any dangling dot.
function trimZero(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Round to 2 decimals so 0.30 * 1000 = 300 (not 300.00000000003).
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, '');
}
