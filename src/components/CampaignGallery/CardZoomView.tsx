import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  Nfc,
  Zap,
  Users,
  Info,
  CalendarDays,
  Clock,
  Sparkles,
} from 'lucide-react';
import iphoneBackBlack from '@/assets/iphone-case-black.png';
import iphoneBackWhite from 'figma:asset/771d461e7de4d0c40d4ef5fcc5c59768d30ec60e.png';

// Read the documentElement's `dark` class so the iPhone case photo matches the
// active theme — black case in dark mode, white case in light mode. We watch
// the class for changes so a runtime theme toggle re-skins the device without
// a remount.
function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    const sync = () => setIsDark(el.classList.contains('dark'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return isDark;
}
import type { GalleryCampaign } from '../../data/galleryCampaigns';
import { CHAINS } from './chainColors';
import { ScrubStrip } from './ScrubStrip';
import { CastSequence } from './CastSequence';

interface CardZoomViewProps {
  campaign: GalleryCampaign;
  slotted: boolean;
  onClose: () => void;
  // Cast handoff carries the chosen frame index for animated series so the
  // commit step knows which still the user picked.
  onCast?: (campaign: GalleryCampaign, frameIdx: number) => void;
}

// Detail view that opens when a user taps a card in the wall. Visually echoes
// the main-branch campaign detail page (iPhone back photo, the chosen image
// sitting in the e-ink display slot) but rebuilt in the gallery's dark Matte
// Obsidian language so it doesn't whiplash from the wall behind it.
export function CardZoomView({ campaign, slotted, onClose, onCast }: CardZoomViewProps) {
  const chain = CHAINS[campaign.chain];
  const isDark = useIsDark();
  const iphoneBackImg = isDark ? iphoneBackBlack : iphoneBackWhite;
  // Theme palette — every surface in this view derives its colour from here so
  // a light/dark toggle re-skins the whole detail page cohesively. Brand
  // accents (chain colour, Prism gradient on CTA, mint/violet pool tags) stay
  // identical across themes; only neutrals swap.
  const t = isDark
    ? {
        backdropBrightness: 0.45,
        scrim:
          'radial-gradient(ellipse at center, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.85) 80%)',
        headerBg: 'rgba(10,10,10,0.55)',
        heroOverlay:
          'linear-gradient(to bottom, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.4) 45%, transparent 100%)',
        cardBg: 'rgba(20,20,22,0.55)',
        cardBorder: 'rgba(255,255,255,0.10)',
        text1: '#FFFFFF',
        text2: 'rgba(255,255,255,0.70)',
        text3: 'rgba(255,255,255,0.55)',
        text4: 'rgba(255,255,255,0.45)',
        divider: 'rgba(255,255,255,0.10)',
        track: 'rgba(255,255,255,0.08)',
        ctaMutedBg: 'rgba(255,255,255,0.08)',
        ctaMutedText: 'rgba(255,255,255,0.55)',
      }
    : {
        backdropBrightness: 0.85,
        scrim:
          'radial-gradient(ellipse at center, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.88) 80%)',
        headerBg: 'rgba(255,255,255,0.65)',
        heroOverlay:
          'linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 45%, transparent 100%)',
        cardBg: 'rgba(255,255,255,0.72)',
        cardBorder: 'rgba(0,0,0,0.10)',
        text1: '#1A1A1A',
        text2: 'rgba(26,26,26,0.72)',
        text3: 'rgba(26,26,26,0.58)',
        text4: 'rgba(26,26,26,0.42)',
        divider: 'rgba(0,0,0,0.10)',
        track: 'rgba(0,0,0,0.08)',
        ctaMutedBg: 'rgba(0,0,0,0.06)',
        ctaMutedText: 'rgba(26,26,26,0.55)',
      };
  const hasFrames = !!campaign.frames && campaign.frames.length > 1;
  // Active frame for animated series. We start on frame 0 — the wall's auto-
  // play resets there when the card un-lights, so this is consistent with
  // what the user just saw.
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const activeFrame = hasFrames ? campaign.frames![activeFrameIdx] : null;
  const displayImage = activeFrame?.image ?? campaign.image;
  const displayPayout = activeFrame?.tokensPerCast ?? campaign.tokensPerCast;
  // The cast sequence lives inside the open card. Tapping the CTA arms it;
  // releasing before the commit haptic cancels cleanly, completing the sequence
  // hands off to the parent.
  const [castOpen, setCastOpen] = useState(false);

  const poolClaimedPct = Math.min(100, Math.max(0, 100 - campaign.poolRemaining));
  const totalPool = campaign.totalEdition * campaign.tokensPerCast;
  const remainingPool = Math.round(totalPool * (campaign.poolRemaining / 100));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="absolute inset-0 z-30 overflow-hidden"
    >
      {/* Blurred backdrop of the chosen image — same TikTok-style backdrop the
          main branch uses, tuned darker so it reads as receded against the
          gallery's Matte Obsidian language. */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={displayImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-125"
          style={{ filter: `blur(48px) saturate(1.4) brightness(${t.backdropBrightness})` }}
        />
        <div className="absolute inset-0" style={{ background: t.scrim }} />
      </div>

      {/* Scrim — clicking anywhere on empty background closes. Pointer events
          must land here, not pass to the wall behind. */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        onClick={onClose}
      />

      {/* Scrollable detail column */}
      <div className="relative z-[2] h-full overflow-y-auto overscroll-contain">
        {/* Header */}
        <div
          className="sticky top-0 z-20 backdrop-blur-md border-b"
          style={{ background: t.headerBg, borderColor: t.divider }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1"
              style={{ color: t.text2 }}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
            <h2 className="text-base font-semibold" style={{ color: t.text1 }}>
              Campaign Details
            </h2>
            <div className="w-12" />
          </div>
        </div>

        {/* Hero: iPhone case photo on right with the campaign image fitted into
            the e-ink display slot. Left half carries the headline copy. */}
        <div className="relative overflow-hidden">
          {/* Chain-tinted ambient glow behind the device — softer than main's
              rainbow spots, matches the wall's aura language. */}
          <div
            className="absolute top-8 right-0 w-64 h-64 rounded-full opacity-40 blur-3xl pointer-events-none"
            style={{ background: chain.color }}
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-25 blur-3xl pointer-events-none"
            style={{ background: 'rgba(0,255,194,0.5)' }}
          />

          {/* Device photo + e-ink slot inset. The slot position/dimensions are
              transcribed from the main-branch detail page so the alignment to
              the iPhone PNG stays exact. */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-[-80px] top-[12px] w-[360px] pointer-events-none z-[2]"
          >
            <img
              src={iphoneBackImg}
              alt="AdPal device preview"
              className="w-full h-auto object-contain"
              style={{
                filter:
                  'drop-shadow(0 22px 50px rgba(0,255,194,0.18)) drop-shadow(0 8px 16px rgba(188,19,254,0.18))',
              }}
            />

            {/* E-ink display overlay — the gallery card's image sits inside the
                screen rectangle so the user sees exactly what their case would
                show after casting. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="absolute overflow-hidden z-10"
              style={{
                top: '222px',
                left: '99px',
                borderRadius: '7px',
                width: '168px',
                height: '250px',
                background: '#0A0A0A',
              }}
            >
              <img
                src={displayImage}
                alt={campaign.title}
                className="w-full h-full object-cover"
                style={{ filter: 'contrast(1.04) brightness(0.96)' }}
              />
              {/* Subtle e-ink sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
            </motion.div>
          </motion.div>

          {/* Scrub strip — anchored directly under the e-ink case so the user
              treats it as a control attached to the device preview. Width is
              the same as the e-ink screen and the strip carries no chrome
              (frame counter / shuffle removed) — the case above is the live
              readout for the active frame. */}
          {hasFrames && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              className="absolute z-[5]"
              style={{ right: -80, top: 484, width: 360 }}
            >
              <div style={{ marginLeft: 99, width: 168 }}>
                <ScrubStrip
                  frames={campaign.frames!}
                  activeIdx={activeFrameIdx}
                  onScrub={setActiveFrameIdx}
                />
              </div>
            </motion.div>
          )}

          {/* Full-width glass overlay over the top of the hero — theme-tinted
              so the title reads cleanly against either page background. */}
          <div
            className="absolute inset-x-0 top-0 z-[3] pointer-events-none"
            style={{
              height: '170px',
              background: t.heroOverlay,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
            }}
          />

          {/* Category + title + description, left-aligned so the iPhone has the
              right half. */}
          <div className="relative z-[4] px-4 pt-6 pb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-3"
            >
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{
                  background: `${chain.color}1F`,
                  color: chain.color,
                  border: `1px solid ${chain.color}55`,
                }}
              >
                <Sparkles className="w-2.5 h-2.5 opacity-80" />
                {chain.label}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-3 text-[24px] font-bold leading-tight max-w-[60%]"
              style={{ color: t.text1 }}
            >
              {campaign.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm leading-relaxed max-w-[60%] mt-1"
              style={{ color: t.text2 }}
            >
              {campaign.description}
            </motion.p>
          </div>

          {/* Left-half stat blocks (right half = iPhone photo) */}
          <div className="relative z-[4] px-4 pb-6">
            <div className="w-[58%] space-y-3">
              {/* Per-cast reward — primary highlight */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="relative overflow-hidden rounded-[10px] p-4 border"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(0,255,194,0.10) 0%, rgba(188,19,254,0.06) 100%)',
                  borderColor: 'rgba(0,255,194,0.22)',
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 4px 20px rgba(0,255,194,0.08)',
                }}
              >
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-25 blur-xl bg-[#00FFC2]" />
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, #00FFC2 0%, #BC13FE 100%)',
                    }}
                  >
                    <Zap className="w-3 h-3 text-[#0A0A0A]" />
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: t.text2 }}
                  >
                    Per Cast Reward
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-[32px] font-bold leading-none tabular-nums"
                    style={{
                      background: 'linear-gradient(90deg, #00FFC2, #BC13FE)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {displayPayout}
                  </span>
                  <span className="text-sm font-medium" style={{ color: t.text2 }}>
                    {campaign.tokenSymbol}
                  </span>
                </div>
                <div
                  className="mt-2.5 pt-2.5 flex items-center justify-between"
                  style={{ borderTop: `1px solid ${t.divider}` }}
                >
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3" style={{ color: t.text3 }} />
                    <span className="text-[10px]" style={{ color: t.text2 }}>
                      <span className="font-semibold" style={{ color: t.text1 }}>
                        {campaign.edition}
                      </span>{' '}
                      casters joined
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Pool activity — FOMO bar tinted by chain */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="rounded-[10px] p-3.5 border"
                style={{
                  background: t.cardBg,
                  borderColor: `${chain.color}33`,
                  backdropFilter: 'blur(6px)',
                  boxShadow: `0 4px 16px ${chain.color}14`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: chain.color }}
                    />
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: t.text2 }}
                    >
                      Pool Activity
                    </span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: chain.color }}>
                    {poolClaimedPct}%
                  </span>
                </div>

                <div
                  className="relative h-2.5 rounded-full overflow-hidden mb-2.5"
                  style={{ background: t.track }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${poolClaimedPct}%` }}
                    transition={{ duration: 1.2, delay: 0.55, ease: 'easeOut' }}
                    className="h-full rounded-full relative"
                    style={{
                      background: `linear-gradient(90deg, ${chain.color}, ${chain.color}cc)`,
                      boxShadow: `0 0 12px ${chain.color}66`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-white/15" />
                  </motion.div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div>
                    <div className="text-[#00FFC2] font-medium">Claimed</div>
                    <div
                      className="text-sm font-bold tabular-nums"
                      style={{ color: t.text1 }}
                    >
                      {(totalPool - remainingPool).toLocaleString()}
                    </div>
                  </div>
                  <div className="w-px h-8" style={{ background: t.divider }} />
                  <div className="text-right">
                    <div className="text-[#BC13FE] font-medium">Available</div>
                    <div className="text-sm font-bold text-[#BC13FE] tabular-nums">
                      {remainingPool.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Cast duration — battery-block visualization */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="rounded-[10px] px-3 py-2.5 border"
                style={{
                  background: t.cardBg,
                  borderColor: t.cardBorder,
                  backdropFilter: 'blur(6px)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium"
                    style={{ color: t.text3 }}
                  >
                    <Clock className="w-3 h-3" />
                    Cast Duration
                  </span>
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: t.text1 }}
                  >
                    {campaign.durationHours}h
                  </span>
                </div>
                <div className="flex items-end gap-[3px]">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.6 + i * 0.05, duration: 0.3 }}
                      className="flex-1 rounded-[2px] origin-bottom"
                      style={{
                        height: `${12 + i * 1.5}px`,
                        background:
                          i < campaign.durationHours
                            ? 'linear-gradient(to top, #00FFC2, #BC13FE)'
                            : t.track,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px]" style={{ color: t.text4 }}>1h</span>
                  <span className="text-[8px]" style={{ color: t.text4 }}>8h</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* CTA — Prism gradient when actionable, muted when already in case */}
        <div className="px-4 mt-5">
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (slotted) return;
              setCastOpen(true);
            }}
            className="w-full h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2"
            style={{
              background: slotted
                ? t.ctaMutedBg
                : 'linear-gradient(135deg, #00FFC2 0%, #BC13FE 100%)',
              color: slotted ? t.ctaMutedText : '#0A0A0A',
              boxShadow: slotted ? 'none' : '0 0 32px rgba(0,255,194,0.35)',
            }}
          >
            <Nfc className="w-5 h-5" />
            {slotted
              ? 'Already in your case'
              : hasFrames
              ? 'Cast this frame and start earning'
              : 'Cast this ad and start earning'}
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.75 }}
            className="flex items-center justify-center gap-1.5 mt-2.5"
          >
            <CalendarDays className="w-3 h-3" style={{ color: t.text3 }} />
            <span className="text-[11px]" style={{ color: t.text3 }}>
              Edition{' '}
              <span className="font-semibold" style={{ color: t.text1 }}>
                #{campaign.edition}
              </span>{' '}
              of {campaign.totalEdition}
            </span>
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="px-4 mt-5 mb-8"
        >
          <div
            className="rounded-[10px] overflow-hidden border"
            style={{ background: t.cardBg, borderColor: t.cardBorder }}
          >
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: `1px solid ${t.divider}` }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #00FFC2 0%, #BC13FE 100%)',
                }}
              >
                <Info className="w-3.5 h-3.5 text-[#0A0A0A]" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold" style={{ color: t.text1 }}>
                How It Works
              </span>
            </div>

            <div className="px-4 py-3 space-y-2.5">
              {[
                `Your e-ink display locks for ${campaign.durationHours} hours while showing the campaign ad.`,
                'Screen stays active so the network can verify your participation.',
                `Once complete, claim your ${campaign.tokenSymbol} within 24 hours to your wallet.`,
              ].map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 + i * 0.08 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-[10px] font-bold mt-0.5" style={{ color: '#00FFC2' }}>
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed" style={{ color: t.text2 }}>
                    {text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Press-and-hold cast sequence overlay */}
      <AnimatePresence>
        {castOpen && (
          <CastSequence
            campaign={campaign}
            frameImage={displayImage}
            onCancel={() => setCastOpen(false)}
            onComplete={() => {
              setCastOpen(false);
              onCast?.(campaign, activeFrameIdx);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
