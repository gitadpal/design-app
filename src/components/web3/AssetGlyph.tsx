import { TokenLogo } from './TokenLogo';
import { ChainLogo } from './ChainLogo';
import type { ChainId } from '../CampaignGallery/chainColors';

interface AssetGlyphProps {
  symbol: string;
  chainId: ChainId;
  size?: number;
  // Chain badge diameter as a fraction of the token size.
  badgeRatio?: number;
  // Colour of the ring separating the badge from the token — usually the
  // surface the glyph sits on, so the network mark reads as its own coin.
  ringColor?: string;
}

// SiXPay-style asset glyph — the round token logo with the settlement network's
// logo pinned as a small badge on its bottom-right corner. Mirrors sdk-ui's
// AssetSelectionPanel, which overlays `networkLogo` at right/bottom -2 with a
// surface-coloured ring. Both layers reuse the app's own web3 logo components
// (CoinCap token icons, Trust Wallet chain logos) and their graceful fallbacks.
export function AssetGlyph({
  symbol,
  chainId,
  size = 40,
  badgeRatio = 0.4,
  ringColor = 'var(--card)',
}: AssetGlyphProps) {
  // SiXPay pins a fixed 16px network badge on a 40px token; keep that ratio so
  // the mark scales cleanly at any glyph size, and round to whole pixels.
  const badge = Math.round(size * badgeRatio);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Transparent backing: full-bleed coin marks fill the circle, and icons
          with baked-in padding sit on the surface instead of a white ring. */}
      <TokenLogo symbol={symbol} size={size} bg="transparent" />
      {/* Network badge — bottom-right, ringed 1px in the surface colour so it
          reads as its own coin (sdk-ui: right/bottom -2, 1px solid surface). */}
      <span
        className="absolute rounded-full"
        style={{
          right: -2,
          bottom: -2,
          width: badge + 2,
          height: badge + 2,
          background: ringColor,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0,
        }}
      >
        <ChainLogo chainId={chainId} size={badge} />
      </span>
    </div>
  );
}
