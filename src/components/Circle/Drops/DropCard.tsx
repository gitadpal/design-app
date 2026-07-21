import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { Card } from '../../ui/card';
import { CIRCLE_TILE_ASPECT, DROPS_PRISM } from '../constants';
import { getSeries, type Drop } from '../../../data/dropsData';
import { FinishOverlay, RarityBadge } from './FinishOverlay';

// One collectible in the wall. Two states, same 5/7 e-ink tile as the rest of
// Circle so drops read as the same hardware family:
//   • sealed  — a foil capsule; the character + finish are hidden until the
//     cast-to-reveal ritual runs. Only ever true for drops bought as a blind box
//     from Subs. A heavily-obscured ghost of the art teases "something's inside".
//   • revealed — the character, its rarity finish overlay, a rarity badge, and
//     the name caption. This is every created drop, and every sealed one after
//     it develops on the case.

interface DropCardProps {
  drop: Drop;
  onClick: () => void;
  // Grids pass false so a wall of tiles doesn't animate dozens of sheens at once;
  // the detail hero + reveal keep finishes live.
  animated?: boolean;
}

export function DropCard({ drop, onClick, animated = false }: DropCardProps) {
  const series = getSeries(drop.seriesId);

  if (drop.sealed) {
    return (
      <button type="button" onClick={onClick} className="w-full transition active:scale-[0.97]">
        <Card
          className={`relative ${CIRCLE_TILE_ASPECT} w-full overflow-hidden border-0`}
          style={{ background: '#0d0d10', boxShadow: '0 3px 14px rgba(0,0,0,0.5)' }}
        >
          {/* Ghost of the art — blurred to illegibility so there's intrigue, not
              a reveal. */}
          <ImageWithFallback
            src={drop.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(22px) grayscale(1) brightness(0.5)', transform: 'scale(1.3)', opacity: 0.35 }}
          />
          {/* Prism foil wrap */}
          <div className="absolute inset-0" style={{ background: DROPS_PRISM, opacity: 0.5, mixBlendMode: 'overlay' }} />
          <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 0 1.5px rgba(0,255,194,0.5), inset 0 0 30px rgba(188,19,254,0.3)' }} />
          {/* Shimmer sweep */}
          <motion.div
            aria-hidden
            className="absolute top-[-20%] bottom-[-20%] w-1/3"
            style={{ background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.6), transparent)', filter: 'blur(4px)', transform: 'skewX(-12deg)' }}
            initial={{ left: '-40%' }}
            animate={{ left: '130%' }}
            transition={{ duration: 3.6, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
          />
          {/* Center emblem */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2 text-center">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.4)', boxShadow: '0 0 18px rgba(0,255,194,0.4)' }}
            >
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/90 leading-tight">
              {series.title}
            </div>
            <div className="text-[8px] uppercase tracking-[0.2em] text-white/55">Sealed</div>
          </div>
          {/* Rarity "?" badge */}
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-black/60 text-white/85 border border-white/20">
            ?
          </span>
        </Card>
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className="w-full transition active:scale-[0.97]">
      <Card className={`relative ${CIRCLE_TILE_ASPECT} w-full overflow-hidden border border-white/10 bg-[#111]`}>
        <ImageWithFallback
          src={drop.imageUrl}
          alt={drop.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <FinishOverlay rarity={drop.rarity} animated={animated} />

        {/* Rarity badge, top-right */}
        <div className="absolute top-1.5 right-1.5">
          <RarityBadge rarity={drop.rarity} serial={drop.serial} />
        </div>

        {/* Bottom scrim + name caption */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.88) 100%)' }}
        />
        <div className="absolute inset-x-0 bottom-0 px-1.5 pb-1.5 text-center" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}>
          <div className="font-sans font-bold text-[10px] leading-tight text-white truncate">{drop.name}</div>
          <div className="font-mono text-[8px] leading-tight text-white/60 truncate">{series.title}</div>
        </div>
      </Card>
    </button>
  );
}
