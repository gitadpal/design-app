import { useState } from 'react';
import { CHAINS, type ChainId } from '../CampaignGallery/chainColors';

interface ChainLogoProps {
  chainId: ChainId;
  size?: number;
  className?: string;
  // Adds a soft chain-colour ring around the logo when true.
  ringed?: boolean;
}

// Renders the official chain logo (DefiLlama CDN, already wired in
// chainColors). Falls back to the chain glyph on a tinted disc when no logo
// is available (e.g. `multi`) or the request 404s.
export function ChainLogo({ chainId, size = 24, className = '', ringed = false }: ChainLogoProps) {
  const chain = CHAINS[chainId];
  const [failed, setFailed] = useState(false);

  const ringStyle = ringed
    ? { boxShadow: `0 0 0 1.5px ${chain.color}99, 0 0 8px ${chain.color}33` }
    : undefined;

  if (chain.logo && !failed) {
    return (
      <img
        src={chain.logo}
        alt={chain.label}
        onError={() => setFailed(true)}
        className={`rounded-full bg-white object-cover ${className}`}
        style={{ width: size, height: size, ...ringStyle }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        background: chain.color,
        color: '#fff',
        fontSize: size * 0.5,
        fontWeight: 700,
        ...ringStyle,
      }}
    >
      {chain.glyph}
    </div>
  );
}
