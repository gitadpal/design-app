import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Nfc, Sparkles, Frame, Check } from 'lucide-react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { useDrop, revealDrop } from './dropsStore';
import { useDitheredImage } from '../../CampaignGallery/dither';
import { FinishOverlay, RarityBadge } from './FinishOverlay';
import { RARITY_META, isSpecialFinish } from './rarity';
import { getSeries } from '../../../data/dropsData';
import { EINK_ASPECT_RATIO, DROPS_PRISM, DROPS_MINT } from '../constants';

interface DropRevealProps {
  dropId: string;
  onDone: () => void;
  onCancel: () => void;
  onDisplayOnCase: (image: { id: string; url: string; title: string }) => void;
}

// The reveal ritual — the emotional peak of the whole feature. A sealed drop is
// unboxed by CASTING it: press-and-hold fires the NFC handshake (same commit
// mechanic as the campaign CastSequence), then e-ink's slow "develop" resolves
// the character out of a Floyd–Steinberg dither — the weakness (slow refresh)
// turned into the unboxing, and conveniently masking generation latency (§5).
//
// Beats: 'hold' (press & hold) → commit → 'develop' (dither irons in, then color
// blooms) → 'revealed' (finish flourish + rarity banner + now-showing-on-case).

type Beat = 'hold' | 'develop' | 'revealed';
const T_COMMIT = 600;      // ms held before the cast commits
const T_COLOR = 1100;      // into develop: dither → full color crossfade
const T_REVEALED = 2000;   // into develop: flourish + banner

export function DropReveal({ dropId, onDone, onCancel, onDisplayOnCase }: DropRevealProps) {
  const drop = useDrop(dropId);
  const [beat, setBeat] = useState<Beat>('hold');
  const [pressing, setPressing] = useState(false);
  const pressStartRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);

  const ditherActive = beat === 'develop' || beat === 'revealed';
  const dithered = useDitheredImage(drop?.imageUrl ?? null, ditherActive);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const commit = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { (navigator as any).vibrate?.([18, 30, 18]); } catch {}
    }
    // Lift the seal in the store now, so the collection is consistent even if the
    // user navigates away mid-animation. The ritual just plays the reveal.
    revealDrop(dropId);
    setBeat('develop');
    timersRef.current.push(window.setTimeout(() => setBeat('revealed'), T_REVEALED));
  };

  const beginPress = () => {
    pressStartRef.current = Date.now();
    setPressing(true);
    clearTimers();
    timersRef.current = [window.setTimeout(commit, T_COMMIT)];
  };
  const endPress = () => {
    const held = Date.now() - (pressStartRef.current ?? 0);
    setPressing(false);
    if (held < T_COMMIT) {
      clearTimers();
      pressStartRef.current = null;
    }
  };

  // Push the revealed art to the case once the flourish lands.
  useEffect(() => {
    if (beat !== 'revealed' || !drop) return;
    onDisplayOnCase({ id: drop.id, url: drop.imageUrl, title: drop.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  if (!drop) return null;
  const series = getSeries(drop.seriesId);
  const meta = RARITY_META[drop.rarity];

  return (
    // Root is the scroll container: the ritual centers when it fits and scrolls
    // when it doesn't (short phones, landscape, browser chrome). Kept self-
    // contained (no Radix/scroll-lock) so the reveal can never strand scrolling.
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain" style={{ background: 'rgba(8,8,10,0.96)' }}>
      {/* Ambient finish glow behind everything once revealed */}
      <AnimatePresence>
        {beat === 'revealed' && isSpecialFinish(drop.rarity) && (
          <motion.div
            aria-hidden className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: `radial-gradient(circle at 50% 42%, ${meta.accent}33 0%, transparent 60%)` }}
          />
        )}
      </AnimatePresence>

      <div className="relative min-h-full flex flex-col">
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-3 pt-3">
          <button
            onClick={onCancel}
            disabled={beat !== 'hold'}
            className="text-xs text-white/65 hover:text-white px-2 py-1 disabled:opacity-30 disabled:pointer-events-none"
          >
            ✕ Cancel
          </button>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">
            {beat === 'hold' && 'press & hold to reveal'}
            {beat === 'develop' && 'developing…'}
            {beat === 'revealed' && 'revealed'}
          </div>
          <div className="w-12" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-6">
        {/* The card */}
        <motion.div
          className="relative rounded-2xl overflow-hidden"
          style={{ width: 250, aspectRatio: String(EINK_ASPECT_RATIO), background: '#0A0A0A', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
          animate={{ scale: beat === 'hold' && pressing ? 1.04 : beat === 'revealed' ? 1.03 : 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Sealed foil — present while holding, fades as develop begins */}
          <motion.div className="absolute inset-0" animate={{ opacity: beat === 'hold' ? 1 : 0 }} transition={{ duration: 0.5 }}>
            <ImageWithFallback src={drop.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(28px) grayscale(1) brightness(0.5)', transform: 'scale(1.4)', opacity: 0.4 }} />
            <div className="absolute inset-0" style={{ background: DROPS_PRISM, opacity: 0.55, mixBlendMode: 'overlay' }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <motion.div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.4)', boxShadow: '0 0 26px rgba(0,255,194,0.5)' }}
                animate={{ scale: pressing ? [1, 1.12, 1] : 1 }}
                transition={{ duration: 0.8, repeat: pressing ? Infinity : 0 }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/85">{series.title}</div>
            </div>
          </motion.div>

          {/* Dithered "develop" layer — e-ink stipple ironing in top-to-bottom */}
          {ditherActive && (
            <motion.div
              className="absolute inset-0"
              initial={{ clipPath: 'inset(0 0 100% 0)' }}
              animate={{ clipPath: 'inset(0 0 0% 0)' }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
            >
              {dithered ? (
                <img src={dithered} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              ) : (
                <ImageWithFallback src={drop.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'grayscale(1) contrast(1.6)' }} />
              )}
            </motion.div>
          )}

          {/* Full-color bloom — crossfades over the dither after it lands */}
          {ditherActive && (
            <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: T_COLOR / 1000 }}>
              <ImageWithFallback src={drop.imageUrl} alt={drop.name} className="absolute inset-0 w-full h-full object-cover" />
            </motion.div>
          )}

          {/* Finish flourish, once revealed */}
          {beat === 'revealed' && (
            <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
              <FinishOverlay rarity={drop.rarity} animated />
            </motion.div>
          )}

          {/* e-ink refresh flash at commit */}
          {beat === 'develop' && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.6)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0, 0.35, 0] }}
              transition={{ duration: 1.1 }}
            />
          )}

          {/* Scan line following the develop edge */}
          {beat === 'develop' && (
            <motion.div
              aria-hidden className="absolute left-0 right-0 h-6 pointer-events-none"
              style={{ background: `linear-gradient(180deg, transparent, ${DROPS_MINT}cc, transparent)` }}
              initial={{ top: '-6%' }}
              animate={{ top: '104%' }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
            />
          )}
        </motion.div>

        {/* Rarity banner */}
        <div className="mt-6 min-h-[92px] flex flex-col items-center justify-start">
          <AnimatePresence mode="wait">
            {beat === 'revealed' ? (
              <motion.div
                key="revealed"
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="text-lg font-bold text-white">{drop.name}</div>
                <div className="mt-1.5"><RarityBadge rarity={drop.rarity} serial={drop.serial} size="md" /></div>
                {isSpecialFinish(drop.rarity) && (
                  <div className="text-[11px] mt-1.5" style={{ color: meta.accent }}>
                    {drop.rarity === 'secret' ? `A Secret pull — 1 in 100!` : `A ${meta.label} finish!`}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="pre" className="text-center text-white/70 text-xs max-w-[240px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {beat === 'hold'
                  ? 'Tap your case and hold. The e-ink will slowly develop what’s inside.'
                  : 'Ironing onto your case…'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        {beat === 'hold' && (
          <button
            type="button"
            onPointerDown={beginPress}
            onPointerUp={endPress}
            onPointerCancel={endPress}
            onPointerLeave={() => { if (pressing) endPress(); }}
            className="mt-2 w-full max-w-[280px] h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 select-none touch-none text-[#08110f]"
            style={{ background: DROPS_PRISM, boxShadow: pressing ? '0 0 40px rgba(0,255,194,0.6)' : '0 0 24px rgba(0,255,194,0.35)' }}
          >
            <Nfc className="w-4 h-4" />
            {pressing ? 'Hold…' : 'Press & hold to cast & reveal'}
          </button>
        )}
        {beat === 'revealed' && (
          <div className="mt-2 w-full max-w-[280px] grid gap-2.5">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: DROPS_MINT }}>
              <Frame className="w-4 h-4" />
              Now showing on your case
            </div>
            <button
              onClick={onDone}
              className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-[#08110f] transition active:scale-[0.98]"
              style={{ background: DROPS_PRISM }}
            >
              <Check className="w-4 h-4" />
              Done
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
