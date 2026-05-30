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
  // Rounded chain logo for the top-right card badge. DefiLlama's icon CDN —
  // stable filenames + size-optimised. The `multi` chain has no single logo;
  // we fall back to the glyph in the badge when logo is null.
  logo: string | null;
}

const LLAMA = (name: string) => `https://icons.llamao.fi/icons/chains/rsz_${name}.jpg`;

export const CHAINS: Record<ChainId, ChainMeta> = {
  ethereum: { id: 'ethereum', label: 'ETH',  color: '#627EEA', glyph: '◆', logo: LLAMA('ethereum') },
  base:     { id: 'base',     label: 'BASE', color: '#0052FF', glyph: '▣', logo: LLAMA('base') },
  arbitrum: { id: 'arbitrum', label: 'ARB',  color: '#28A0F0', glyph: '◆', logo: LLAMA('arbitrum') },
  bnb:      { id: 'bnb',      label: 'BNB',  color: '#F0B90B', glyph: '⬡', logo: LLAMA('bsc') },
  bitcoin:  { id: 'bitcoin',  label: 'BTC',  color: '#F7931A', glyph: '₿', logo: LLAMA('bitcoin') },
  solana:   { id: 'solana',   label: 'SOL',  color: '#9945FF', glyph: '◎', logo: LLAMA('solana') },
  polygon:  { id: 'polygon',  label: 'POLY', color: '#8247E5', glyph: '⬢', logo: LLAMA('polygon') },
  optimism: { id: 'optimism', label: 'OP',   color: '#FF0420', glyph: '◉', logo: LLAMA('optimism') },
  multi:    { id: 'multi',    label: 'MULTI',color: '#9CA3AF', glyph: '⬢', logo: null },
};
