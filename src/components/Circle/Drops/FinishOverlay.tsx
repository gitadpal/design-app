import { motion } from 'motion/react';
import { RARITY_META, SECRET_EDITION, isSpecialFinish, type Rarity } from './rarity';

// Rarity pill — the label a collector reads first. Special finishes (holo/gold/
// secret) get a filled, glowing chip in their accent; common/rare stay quiet.
export function RarityBadge({
  rarity,
  serial,
  size = 'sm',
}: {
  rarity: Rarity;
  serial?: number;
  size?: 'sm' | 'md';
}) {
  const meta = RARITY_META[rarity];
  const special = isSpecialFinish(rarity);
  const pad = size === 'md' ? 'px-2.5 py-1 text-[11px]' : 'px-1.5 py-0.5 text-[9px]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider ${pad}`}
      style={
        special
          ? { background: meta.accent, color: meta.onAccent, boxShadow: `0 0 10px ${meta.accent}99` }
          : { background: 'rgba(0,0,0,0.55)', color: meta.accent, border: `1px solid ${meta.accent}66` }
      }
    >
      {meta.label}
      {rarity === 'secret' && serial != null && (
        <span className="tabular-nums opacity-80">#{serial}/{SECRET_EDITION}</span>
      )}
    </span>
  );
}

// The visual language of rarity. A finish overlay sits above a drop's artwork
// (inside a rounded, clipped container) and gives each tier its signature: rare
// a cool sheen, holo an iridescent wash, gold a foil glint, secret the brand
// Prism (mint → violet). Common gets nothing — its plainness is the point, and
// it's what makes the specials read as special. Reused by the tile, the detail
// hero, and the reveal ritual so a finish looks identical everywhere.

// A single specular streak that sweeps diagonally across the artwork on a loop —
// the "glint" micro-interaction the brand calls for (crisp, deliberate).
function Sheen({
  color = 'rgba(255,255,255,0.75)',
  duration = 3.4,
  repeatDelay = 1.6,
  width = '34%',
}: {
  color?: string;
  duration?: number;
  repeatDelay?: number;
  width?: string;
}) {
  return (
    <motion.div
      aria-hidden
      className="absolute top-[-20%] bottom-[-20%]"
      style={{
        width,
        background: `linear-gradient(100deg, transparent 0%, ${color} 50%, transparent 100%)`,
        filter: 'blur(3px)',
        transform: 'skewX(-12deg)',
      }}
      initial={{ left: '-40%' }}
      animate={{ left: '130%' }}
      transition={{ duration, repeat: Infinity, repeatDelay, ease: 'easeInOut' }}
    />
  );
}

interface FinishOverlayProps {
  rarity: Rarity;
  // When false the overlay renders static (no motion) — used in dense grids where
  // dozens of animated tiles would thrash. Detail + reveal keep it live.
  animated?: boolean;
}

export function FinishOverlay({ rarity, animated = true }: FinishOverlayProps) {
  if (rarity === 'common') return null;

  if (rarity === 'rare') {
    return (
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Cool inset ring + faint blue specular corner */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 0 1.5px rgba(125,211,252,0.55), inset 0 0 22px rgba(56,189,248,0.18)',
            background:
              'linear-gradient(135deg, rgba(125,211,252,0.16) 0%, transparent 34%, transparent 70%, rgba(191,219,254,0.14) 100%)',
          }}
        />
        {animated && <Sheen color="rgba(186,230,253,0.55)" duration={4} repeatDelay={2.4} />}
      </div>
    );
  }

  if (rarity === 'holo') {
    return (
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Iridescent wash — a wide rainbow band that drifts across, blended so it
            reads as light refracting on foil rather than a flat sticker. */}
        <motion.div
          className="absolute inset-[-40%]"
          style={{
            background:
              'linear-gradient(115deg, #ff7ab6, #ffd36e, #7df9c6, #7ab8ff, #c17dff, #ff7ab6)',
            backgroundSize: '260% 260%',
            mixBlendMode: 'color-dodge',
            opacity: 0.35,
          }}
          animate={animated ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : undefined}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
        />
        <div
          className="absolute inset-0"
          style={{ boxShadow: 'inset 0 0 0 1.5px rgba(196,181,253,0.6), inset 0 0 26px rgba(168,139,250,0.22)' }}
        />
        {animated && <Sheen color="rgba(255,255,255,0.8)" duration={3} repeatDelay={1.2} />}
      </div>
    );
  }

  if (rarity === 'gold') {
    return (
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Warm foil vignette + gold inset frame */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 0 2px rgba(251,191,36,0.75), inset 0 0 30px rgba(217,119,6,0.28)',
            background:
              'radial-gradient(120% 80% at 50% 0%, rgba(253,224,71,0.22) 0%, transparent 55%), linear-gradient(160deg, rgba(251,191,36,0.14), transparent 45%)',
          }}
        />
        {animated && <Sheen color="rgba(255,236,160,0.9)" duration={2.6} repeatDelay={1} width="28%" />}
      </div>
    );
  }

  // secret — the 1-of-N chase. Full Prism gradient border glow + a slow shimmer,
  // the most Web3-forward finish, matching the brand's CTA gradient.
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          boxShadow:
            'inset 0 0 0 2px rgba(0,255,194,0.8), inset 0 0 34px rgba(188,19,254,0.35)',
          background:
            'linear-gradient(135deg, rgba(0,255,194,0.22) 0%, transparent 40%, transparent 60%, rgba(188,19,254,0.24) 100%)',
        }}
        animate={animated ? { opacity: [0.75, 1, 0.75] } : undefined}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {animated && <Sheen color="rgba(0,255,194,0.85)" duration={2.4} repeatDelay={0.6} width="26%" />}
      {animated && <Sheen color="rgba(224,170,255,0.8)" duration={3.1} repeatDelay={1.4} width="22%" />}
    </div>
  );
}
