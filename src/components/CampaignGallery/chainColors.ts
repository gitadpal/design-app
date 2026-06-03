// Chain identity: aura color + glyph for the tail-tag. The aura is what carries
// the chain in space — card body stays Matte Obsidian.
export type ChainId =
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'bnb'
  | 'bitcoin'
  | 'solana'
  | 'polygon'
  | 'optimism'
  | 'multi';

export interface ChainMeta {
  id: ChainId;
  label: string;
  color: string;
  glyph: string;
  // Rounded chain logo for the reward medallion. Sourced from Trust Wallet's
  // public assets repo — higher-resolution PNGs that keep the chain symbol
  // legible at small sizes. (Previously used DefiLlama's `rsz_*.jpg` resized
  // icons, but several collapsed to a featureless colored tile — Base in
  // particular — after the aggressive downscale.) Trust Wallet only ships a
  // single color variant per chain, so we rely on the brand color in the mark
  // for contrast on both light and dark backgrounds; if a chain's logo turns
  // out to need a true light/dark variant, that chain can be swapped to a
  // local SVG. The `multi` chain has no single logo; we fall back to the
  // glyph in the badge when logo is null.
  logo: string | null;
}

const TW = (chain: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/info/logo.png`;

export const CHAINS: Record<ChainId, ChainMeta> = {
  ethereum: { id: 'ethereum', label: 'ETH',  color: '#627EEA', glyph: '◆', logo: TW('ethereum') },
  base:     { id: 'base',     label: 'BASE', color: '#0052FF', glyph: '▣', logo: TW('base') },
  arbitrum: { id: 'arbitrum', label: 'ARB',  color: '#28A0F0', glyph: '◆', logo: TW('arbitrum') },
  bnb:      { id: 'bnb',      label: 'BNB',  color: '#F0B90B', glyph: '⬡', logo: TW('smartchain') },
  bitcoin:  { id: 'bitcoin',  label: 'BTC',  color: '#F7931A', glyph: '₿', logo: TW('bitcoin') },
  solana:   { id: 'solana',   label: 'SOL',  color: '#9945FF', glyph: '◎', logo: TW('solana') },
  polygon:  { id: 'polygon',  label: 'POLY', color: '#8247E5', glyph: '⬢', logo: TW('polygon') },
  optimism: { id: 'optimism', label: 'OP',   color: '#FF0420', glyph: '◉', logo: TW('optimism') },
  multi:    { id: 'multi',    label: 'MULTI',color: '#9CA3AF', glyph: '⬢', logo: null },
};
