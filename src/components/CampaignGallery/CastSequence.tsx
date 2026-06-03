import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Nfc, Check } from 'lucide-react';
import type { GalleryCampaign } from '../../data/galleryCampaigns';
import { CHAINS } from './chainColors';
import { formatPayout } from './formatPayout';
import { useDitheredImage } from './dither';

interface CastSequenceProps {
  campaign: GalleryCampaign;
  frameImage: string;
  onCancel: () => void;
  onComplete: () => void;
}

// The cast gesture is press-and-hold-then-auto-cast. Three beats:
//
//   A 0–200ms      Touchdown. No commitment yet — release = abort cleanly.
//   B 200–600ms    Hold builds: card scales, chrome dims away, aura intensifies.
//                  At ~600ms we fire a haptic pulse marking commitment AND
//                  auto-trigger the NFC handshake. From here, releasing or
//                  keeping the finger down both lead to the same place.
//   C 600ms+       NFC fired. Dithered preview "irons" onto the card with a
//                  refresh ripple; this is the modal the user sees and the
//                  signal that they can let go.
//
// Why no separate "tap your case now" beat: requiring the user to keep holding
// AND physically tap the case is a two-handed coordination ask that feels
// punitive. The hold itself is the commit. NFC fires the moment the press is
// committed; the dithered modal is the confirmation.
type Beat = 'A' | 'B' | 'C';
const T_B_START = 200;
const T_COMMIT = 600;
const T_HANDOFF_AFTER_COMMIT = 1400;

export function CastSequence({ campaign, frameImage, onCancel, onComplete }: CastSequenceProps) {
  const chain = CHAINS[campaign.chain];
  const [beat, setBeat] = useState<Beat>('A');
  const [pressing, setPressing] = useState(false);
  const [hapticPulse, setHapticPulse] = useState(false);
  const pressStartedRef = useRef<number | null>(null);
  const beatTimersRef = useRef<number[]>([]);
  // Real dither computed lazily — only when the user starts pressing, so we
  // don't burn a canvas decode on every card the user just opens to inspect.
  // The result is rendered during beat C as the honest case preview.
  const ditherActive = pressing || beat === 'C';
  const ditheredSrc = useDitheredImage(frameImage, ditherActive);

  // Clear any scheduled beat transitions. We rebuild them on every press-down.
  const clearTimers = () => {
    beatTimersRef.current.forEach((t) => window.clearTimeout(t));
    beatTimersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const fireCommit = () => {
    setHapticPulse(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { (navigator as any).vibrate?.([18, 30, 18]); } catch {}
    }
    window.setTimeout(() => setHapticPulse(false), 240);
    setBeat('C');
    // Once committed, the cast runs to completion regardless of whether the
    // user keeps holding or has already released. Schedule the handoff.
    beatTimersRef.current.push(
      window.setTimeout(() => onComplete(), T_HANDOFF_AFTER_COMMIT),
    );
  };

  const beginPress = () => {
    pressStartedRef.current = Date.now();
    setPressing(true);
    setBeat('A');
    setHapticPulse(false);
    clearTimers();
    beatTimersRef.current = [
      window.setTimeout(() => setBeat('B'), T_B_START),
      window.setTimeout(fireCommit, T_COMMIT),
    ];
  };

  const endPress = () => {
    const startedAt = pressStartedRef.current ?? 0;
    const heldFor = Date.now() - startedAt;
    setPressing(false);

    // Released before commit = clean abort. Tear down pending timers so the
    // commit doesn't fire after the user lifted.
    if (heldFor < T_COMMIT) {
      clearTimers();
      setBeat('A');
      pressStartedRef.current = null;
      return;
    }
    // Released at or after the commit: cast is already in flight via fireCommit.
    // Leave the handoff timer alone — the user can lift their finger now.
    pressStartedRef.current = null;
  };

  // Visual amplitude per beat — drives the card scale, chrome fade, and aura.
  const scaleByBeat: Record<Beat, number> = { A: 1.0, B: 1.06, C: 1.04 };
  const chromeOpacityByBeat: Record<Beat, number> = { A: 1, B: 0.35, C: 0 };
  const auraIntensityByBeat: Record<Beat, number> = { A: 0.4, B: 0.8, C: 1.0 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: 'rgba(10,10,10,0.78)', backdropFilter: 'blur(18px)' }}
    >
      {/* Wall behind dims further as beat progresses */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none transition-colors"
        style={{
          background:
            beat === 'C'
              ? 'rgba(10,10,10,0.92)'
              : beat === 'B'
              ? 'rgba(10,10,10,0.86)'
              : 'rgba(10,10,10,0.78)',
        }}
      />

      {/* Cancel button — only valid before commit. Once we're in beat C the
          cast is firing; the user can release but can't undo. */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={beat === 'C'}
          className="text-xs text-white/65 hover:text-white px-2 py-1 disabled:opacity-40 disabled:pointer-events-none"
        >
          ✕ Cancel
        </button>
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">
          {beat === 'A' && 'press & hold'}
          {beat === 'B' && 'building…'}
          {beat === 'C' && 'casting…'}
        </div>
        <div className="w-12" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Card body — scales + auras with the beat. */}
        <motion.div
          className="relative rounded-2xl"
          animate={{ scale: scaleByBeat[beat] }}
          transition={{ duration: beat === 'C' ? 0.45 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: 240,
            padding: 2,
            background:
              beat === 'C'
                ? 'linear-gradient(135deg, #00FFC2, #BC13FE)'
                : '#1A1A1A',
            boxShadow: `0 0 ${28 + auraIntensityByBeat[beat] * 48}px ${
              8 + auraIntensityByBeat[beat] * 18
            }px ${chain.color}${Math.round(auraIntensityByBeat[beat] * 99)
              .toString(16)
              .padStart(2, '0')}, 0 0 ${48 + auraIntensityByBeat[beat] * 80}px ${
              auraIntensityByBeat[beat] * 28
            }px ${chain.color}40`,
          }}
        >
          <div className="relative rounded-2xl overflow-hidden" style={{ background: '#0A0A0A' }}>
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: '5 / 7' }}>
              {/* Live image. Beat C shows the real Floyd–Steinberg dither
                  computed from the chosen frame — hardware-honest preview of
                  what the case will actually display. If the source image is
                  CORS-tainted (some upstream hosts don't enable CORS), we fall
                  back to a grayscale + contrast CSS approximation. */}
              {beat === 'C' && ditheredSrc ? (
                <img
                  src={ditheredSrc}
                  alt={campaign.title}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                  style={{
                    imageRendering: 'pixelated',
                    filter: 'brightness(1.04)',
                  }}
                />
              ) : (
                <img
                  src={frameImage}
                  alt={campaign.title}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
                  style={{
                    filter:
                      beat === 'C'
                        ? 'grayscale(1) contrast(1.65) brightness(1.0)'
                        : 'contrast(1.04) brightness(0.98)',
                  }}
                />
              )}
              {beat === 'C' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0, 0.45, 0] }}
                  transition={{ duration: 1.0 }}
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'rgba(255,255,255,0.55)' }}
                />
              )}
            </div>
            {/* Chrome — payout chip + advertiser. Fades out as the hold builds
                so only the image remains by beat C, matching the "chrome falls
                away on cast, only image transfers" spec note. */}
            <motion.div
              animate={{ opacity: chromeOpacityByBeat[beat] }}
              transition={{ duration: 0.3 }}
              className="p-3 space-y-0.5"
            >
              {(() => {
                const fmt = formatPayout(campaign.tokensPerCast, campaign.tokenSymbol);
                return (
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold tabular-nums" style={{ color: '#00FFC2' }}>
                      {fmt.value}
                      {fmt.scale && <span style={{ fontWeight: 900, marginLeft: 1 }}>{fmt.scale}</span>}
                    </span>
                    <span className="text-[10px] text-white/85">{fmt.prefix}{fmt.symbol}</span>
                    <span className="text-[10px] text-white/55">/ cast</span>
                  </div>
                );
              })()}
              <div className="text-[11px] text-white/85">{campaign.advertiser}</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Haptic pulse ring — flashes once at the commit moment */}
        <AnimatePresence>
          {hapticPulse && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1.35, opacity: 0 }}
              transition={{ duration: 0.42 }}
              className="absolute rounded-2xl pointer-events-none"
              style={{
                width: 240,
                height: 240 * (7 / 5) + 60,
                border: '2px solid rgba(0,255,194,0.85)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Beat-specific affordance below the card */}
        <div className="mt-6 min-h-[80px] flex flex-col items-center">
          {beat === 'A' && (
            <div className="text-center text-white/70 text-xs">
              Press &amp; hold the button below.
              <br />
              We&apos;ll cast when you feel the pulse.
            </div>
          )}
          {beat === 'B' && (
            <div className="text-center text-white/85 text-xs">
              Almost committed… keep holding.
            </div>
          )}
          {beat === 'C' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: '#00FFC2' }}
            >
              <Check className="w-4 h-4" />
              Cast ironed in — you can release
            </motion.div>
          )}
        </div>

        {/* The press-and-hold target. Pointer down begins the beats; pointer up
            before commit aborts; pointer up after commit is fine — the cast is
            already in flight. */}
        {beat !== 'C' && (
          <button
            type="button"
            onPointerDown={beginPress}
            onPointerUp={endPress}
            onPointerCancel={endPress}
            onPointerLeave={() => {
              // Lifting off the button while pressing should also cancel —
              // the press is gone, even if the pointer event "up" hasn't fired.
              if (pressing) endPress();
            }}
            className="mt-4 w-full max-w-[280px] h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 select-none touch-none"
            style={{
              background: 'linear-gradient(135deg, #00FFC2, #BC13FE)',
              color: '#0A0A0A',
              boxShadow:
                beat === 'A'
                  ? '0 0 24px rgba(0,255,194,0.35)'
                  : '0 0 36px rgba(0,255,194,0.55), 0 0 56px rgba(188,19,254,0.45)',
            }}
          >
            <Nfc className="w-4 h-4" />
            {beat === 'A' && 'Press & hold to cast'}
            {beat === 'B' && 'Hold…'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
