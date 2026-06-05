import { useState } from 'react';
import { getTokenIconUrl } from '../../data/tokenIcons';

interface TokenLogoProps {
  symbol: string;
  size?: number;
  className?: string;
  // Optional tint for the fallback disc when no icon URL is available.
  fallbackColor?: string;
}

// Renders the official token icon (CoinCap CDN) with a graceful initial-letter
// fallback for tokens we don't have a logo for or whose CDN entry 404s at
// runtime.
export function TokenLogo({ symbol, size = 40, className = '', fallbackColor }: TokenLogoProps) {
  const initial = getTokenIconUrl(symbol);
  const [src, setSrc] = useState<string | null>(initial);

  if (src) {
    return (
      <img
        src={src}
        alt={symbol}
        onError={() => setSrc(null)}
        className={`rounded-full bg-white object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-foreground ${className}`}
      style={{
        width: size,
        height: size,
        background: fallbackColor
          ? `${fallbackColor}26`
          : 'rgba(255,255,255,0.06)',
        border: `1px solid ${fallbackColor ? `${fallbackColor}66` : 'rgba(255,255,255,0.10)'}`,
        color: fallbackColor ?? undefined,
      }}
    >
      <span style={{ fontSize: size * 0.4, fontWeight: 600 }}>{symbol.charAt(0)}</span>
    </div>
  );
}
