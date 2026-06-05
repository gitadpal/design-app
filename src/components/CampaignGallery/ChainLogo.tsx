import type { CSSProperties } from 'react';
import { CHAINS, type ChainId } from './chainColors';

// Renders the chain logo as an <img> off Trust Wallet's public assets repo.
// Trust Wallet only ships one (color) variant per chain, but the marks are
// brand-colored — so they carry their own contrast and stay recognizable on
// both light and dark backgrounds. The `multi` pseudo-chain has no canonical
// logo; for it (and for any chain whose `logo` is null) we render the
// chain's glyph character as a fallback.
//
// Theme handling: the colored PNGs are designed to read on either theme, so
// we don't swap assets per theme. If a specific chain's logo doesn't survive
// inversion (e.g. a near-white mark on a near-white card body), the fix is to
// swap that single chain to a hand-prepared monochrome SVG rather than to
// re-source the entire set; see chainColors.ts for the seam.
interface Props {
  chainId: ChainId;
  className?: string;
  style?: CSSProperties;
}

export function ChainLogo({ chainId, className, style }: Props) {
  const chain = CHAINS[chainId];

  if (chain.logo) {
    return (
      <img
        src={chain.logo}
        alt=""
        loading="lazy"
        decoding="async"
        className={className}
        style={style}
        aria-hidden
      />
    );
  }

  // Glyph fallback (currently only `multi`).
  return (
    <span
      className={className}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        color: chain.color,
      }}
      aria-hidden
    >
      {chain.glyph}
    </span>
  );
}
