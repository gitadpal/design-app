import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Clock } from 'lucide-react';
import type { GalleryCampaign } from '../../data/galleryCampaigns';
import { PAYOUT_RANGE } from '../../data/galleryCampaigns';
import { CHAINS } from './chainColors';

export type ChromeLevel = 'out' | 'mid' | 'in';

interface CampaignCardProps {
  campaign: GalleryCampaign;
  slotted?: boolean;
  chrome: ChromeLevel;
  // When true, the card is near the spotlight and animated series should play
  // in place. Off-center cards stay quiet per the design's perf budget.
  isLit?: boolean;
  onTap?: () => void;
}

// Image area aspect is locked to the e-ink case ratio. The design spec calls
// this "TRUE PREVIEW" — the image you see on the card is exactly what will
// display on the user's case. Hardware-honest. Do not parameterize this.
const IMAGE_ASPECT = '5 / 7';

// One frame advances every ~1.1s — slow enough to read each frame's payout,
// fast enough that a series reads as motion in the wall.
const FRAME_INTERVAL_MS = 1100;

function useFrameCycle(frameCount: number, active: boolean): number {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active || frameCount <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % frameCount), FRAME_INTERVAL_MS);
    return () => clearInterval(t);
  }, [active, frameCount]);
  // When the card moves out of the lit zone, leave it on frame 0 so the
  // off-state is consistent across cards (no random freeze frame).
  useEffect(() => {
    if (!active) setIdx(0);
  }, [active]);
  return idx;
}

// Translate tokens-per-cast into [0..1] aura intensity. Top of the range glows
// brightest; bottom still shows a faint rim so every card carries chain identity.
function payoutIntensity(payout: number): number {
  const { min, max } = PAYOUT_RANGE;
  if (max === min) return 0.5;
  return 0.25 + 0.75 * ((payout - min) / (max - min));
}

export function CampaignCard({ campaign, slotted, chrome, isLit, onTap }: CampaignCardProps) {
  const chain = CHAINS[campaign.chain];
  const hasFrames = !!campaign.frames && campaign.frames.length > 1;
  const frameIdx = useFrameCycle(hasFrames ? campaign.frames!.length : 0, !!isLit && hasFrames);
  const activeFrame = hasFrames ? campaign.frames![frameIdx] : null;
  const displayImage = activeFrame?.image ?? campaign.image;
  const displayPayout = activeFrame?.tokensPerCast ?? campaign.tokensPerCast;
  const intensity = payoutIntensity(displayPayout);
  const poolClaimedPct = Math.min(100, Math.max(0, 100 - campaign.poolRemaining));

  // Aura: a soft, colored shadow that bleeds beyond the card body. CSS box-shadow
  // is cheaper than a separate blurred element. Two stops give the "volumetric"
  // halo per spec without canvas/WebGL.
  const auraColor = chain.color;
  const auraShadow = slotted
    ? // Slotted: Prism foil halo, persistent. Reads as "lit" regardless of pan.
      '0 0 24px 4px rgba(0,255,194,0.45), 0 0 48px 12px rgba(188,19,254,0.40)'
    : `0 0 ${10 + intensity * 22}px ${intensity * 8}px ${auraColor}${Math.round(intensity * 90)
        .toString(16)
        .padStart(2, '0')}, 0 0 ${24 + intensity * 36}px ${intensity * 12}px ${auraColor}40`;

  // Trending pulse: restrained warm flame ring that breathes around the aura.
  // Only runs on lit cards (perf budget — design spec § Trending overlay says
  // "throttled to in-viewport cards only"). When the card leaves the spotlight
  // the boxShadow snaps back to the static aura with no flame layer.
  const isTrending = !!campaign.trending && !!isLit;
  const flameLow = ', 0 0 14px 2px rgba(255,106,26,0.22)';
  const flameHigh = ', 0 0 30px 8px rgba(255,72,18,0.48)';
  const animatedShadow = isTrending
    ? [auraShadow + flameLow, auraShadow + flameHigh, auraShadow + flameLow]
    : auraShadow;

  // Sizing scales with chrome: at 'out' the card is ~1/3 of viewport width and
  // every glyph fights for room; at 'in' there's enough surface to spell things
  // out. We keep one stats band layout but two type scales.
  const tight = chrome === 'out';

  return (
    <motion.button
      type="button"
      onClick={onTap}
      whileTap={{ scale: 0.97 }}
      className="relative block w-full h-full text-left rounded-lg focus:outline-none"
      style={{
        background: slotted
          ? 'linear-gradient(135deg, #00FFC2 0%, #BC13FE 100%)'
          : '#1A1A1A',
        // Foil rim for slotted: 1.5px gradient padding; non-slotted: thin
        // dark-grey hairline so cards don't blur together against the Obsidian wall.
        padding: slotted ? 1.5 : 0.5,
      }}
      animate={{ boxShadow: animatedShadow }}
      transition={{
        boxShadow: isTrending
          ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.25 },
      }}
    >
      {/* Inner Matte Obsidian body (so slotted's Prism padding shows as a foil rim) */}
      <div
        className="relative w-full h-full rounded-[7px] overflow-hidden"
        style={{
          background: '#181818',
          // Subtle grain texture per brand spec.
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
          backgroundBlendMode: 'overlay',
        }}
      >
        {/* Image area — exact 5:7 aspect ratio is preserved. The bottom band
            inside this area gets a blurry overlay carrying the campaign title:
            the image is still the true preview, but the user can read what
            they're looking at without leaving the wall. */}
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: IMAGE_ASPECT, backgroundColor: '#0A0A0A' }}
        >
          {/* Animated series cross-fade frames in place. */}
          {hasFrames ? (
            campaign.frames!.map((f, i) => (
              <img
                key={i}
                src={f.image}
                alt={campaign.title}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
                style={{
                  filter: 'contrast(1.04) brightness(0.96)',
                  opacity: i === frameIdx ? 1 : 0,
                }}
              />
            ))
          ) : (
            <img
              src={displayImage}
              alt={campaign.title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              style={{ filter: 'contrast(1.04) brightness(0.96)' }}
            />
          )}

          {/* Bottom title overlay — small portion of the image, blurred, so the
              title is legible over any artwork. The overlay sits *inside* the
              image area so we don't change the 5:7 ratio. */}
          <div
            className="absolute left-0 right-0 bottom-0 pointer-events-none flex items-end"
            style={{
              height: tight ? '34%' : '30%',
              backdropFilter: 'blur(10px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(10px) saturate(1.2)',
              background:
                'linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.55) 55%, rgba(10,10,10,0.78) 100%)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 45%, black 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 45%, black 100%)',
            }}
          >
            <div className="w-full px-1.5 pb-1 flex items-end gap-1">
              <span
                className="block font-bold text-white leading-tight flex-1 min-w-0"
                style={{
                  fontSize: tight ? 9.5 : chrome === 'mid' ? 11 : 12,
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                  display: '-webkit-box',
                  WebkitLineClamp: tight ? 1 : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {campaign.title}
              </span>
              {hasFrames && (
                <Play
                  className="shrink-0 text-white/80"
                  style={{ width: tight ? 8 : 10, height: tight ? 8 : 10 }}
                  fill="currentColor"
                />
              )}
              {/* Duration chip — takes the spot the chain gem used to occupy
                  on the title row. Borderless light glass pill; instead of
                  a hard outline, a soft outer box-shadow in the same tint
                  bleeds the chip's edge into the surrounding overlay so
                  the pill dissolves at its perimeter. */}
              <div
                className="flex items-center gap-0.5 shrink-0 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  padding: tight ? '1.5px 5px' : '2px 6px',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  boxShadow:
                    '0 0 8px 2px rgba(255,255,255,0.12), 0 0 14px 4px rgba(255,255,255,0.06)',
                }}
              >
                <Clock
                  className="text-white/85"
                  style={{ width: tight ? 8 : 9, height: tight ? 8 : 9 }}
                  strokeWidth={2}
                />
                <span
                  className="font-semibold text-white tabular-nums leading-none"
                  style={{ fontSize: tight ? 8.5 : 9.5 }}
                >
                  {campaign.durationHours}h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress footer — the whole area below the image is the progress
            indicator. A chain-color fill spans `poolRemaining%` of the width
            from the left; a large % readout sits right-aligned over the area
            and the token amount + duration tuck into the small font on the
            left. */}
        <ProgressFooter
          campaign={campaign}
          chain={chain}
          slotted={!!slotted}
          tight={tight}
          chrome={chrome}
          payout={displayPayout}
          poolClaimedPct={poolClaimedPct}
        />
      </div>
    </motion.button>
  );
}

function ProgressFooter({
  campaign,
  chain,
  slotted,
  tight,
  chrome,
  payout,
  poolClaimedPct,
}: {
  campaign: GalleryCampaign;
  chain: { color: string; label: string; glyph: string };
  slotted: boolean;
  tight: boolean;
  chrome: ChromeLevel;
  payout: number;
  poolClaimedPct: number;
}) {
  // Full progress band: the whole area below the image carries the campaign's
  // progress. Background is a horizontal fill — chain color (or Prism, when
  // slotted) covers `poolRemaining%` of the width starting from the left, so
  // the colored area shrinks as the pool drains. A big % readout right-aligned
  // takes the full height, and the token + duration micro-text tucks bottom-
  // left.
  const remainingPct = Math.max(0, 100 - poolClaimedPct);
  const accent = slotted ? '#FFFFFF' : chain.color;
  const fillGradient = slotted
    ? 'linear-gradient(135deg, rgba(0,255,194,0.55) 0%, rgba(188,19,254,0.55) 100%)'
    : `linear-gradient(90deg, ${chain.color}80 0%, ${chain.color}40 100%)`;

  // Height scales with chrome so the % stays readable at every zoom step. The
  // masonry packer estimates the smallest case (tight) via STATS_STRIP_EST.
  const height = tight ? 44 : chrome === 'mid' ? 52 : 60;
  const bigSize = tight ? 22 : chrome === 'mid' ? 28 : 34;
  const amountSize = tight ? 14 : chrome === 'mid' ? 18 : 22;
  const symbolSize = tight ? 7.5 : chrome === 'mid' ? 9 : 10.5;
  const padX = tight ? 7 : chrome === 'mid' ? 8 : 10;
  const padY = tight ? 5 : chrome === 'mid' ? 6 : 7;
  // Diameter of the chain logo disc that backs the token amount + symbol on
  // the right of the footer. Bumped up since only the LEFT 3/4 of the disc
  // is visible — the right 1/4 is clipped past the bar's right edge — so a
  // larger disc keeps the visible portion's perceived size in proportion.
  const discSize = (height - padY * 2) * 1.25;
  // Fraction of the disc's width that's visible inside the bar. The rest
  // extends past the right edge and is clipped by the footer's overflow.
  // Tuned smaller so the disc reads more as a chain "cap" peeking in from
  // the edge than a full badge — leaves more room for the text overlay.
  const discVisibleFraction = 0.55;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height,
        background: '#141414',
        borderTop: slotted
          ? '1px solid rgba(255,255,255,0.18)'
          : `1px solid ${chain.color}66`,
      }}
    >
      {/* Progress fill — width = remaining percent. As the pool drains, the
          colored area visibly retreats from the right. */}
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${remainingPct}%`,
          background: fillGradient,
          boxShadow: slotted ? 'none' : `inset 0 0 24px ${chain.color}33`,
        }}
      />

      {/* Soft left-edge fade so the % readout (now anchored on the left)
          sits on a calmer ground when the colored fill stretches near full. */}
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: '50%',
          background:
            'linear-gradient(to left, transparent 0%, rgba(20,20,20,0.7) 100%)',
        }}
      />

      {/* Big percentage — LEFT-aligned, vertically centered, takes the area
          height. Color comes from the chain (or pure white when slotted). */}
      <span
        className="absolute font-bold tabular-nums leading-none"
        style={{
          left: padX,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: bigSize,
          color: accent,
          textShadow: '0 1px 6px rgba(0,0,0,0.55)',
          letterSpacing: '-0.02em',
        }}
      >
        {Math.round(remainingPct)}
        <span style={{ fontSize: bigSize * 0.55, marginLeft: 1 }}>%</span>
      </span>

      {/* Chain logo disc — anchored to the right edge of the footer, only
          its left `discVisibleFraction` portion shows (the rest is clipped
          past the bar's right edge). Lightened versus the previous centered
          treatment so the chain identity reads without overwhelming the
          text overlay. No dark scrim now: relying on textShadow for
          legibility keeps the disc bright. */}
      {!slotted &&
        (chain.logo ? (
          <img
            src={(chain as any).logo}
            alt=""
            loading="lazy"
            className="absolute rounded-full"
            style={{
              width: discSize,
              height: discSize,
              right: -discSize * (1 - discVisibleFraction),
              top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.7,
              boxShadow: `0 0 0 ${tight ? 1 : 1.5}px ${chain.color}99, 0 0 10px ${chain.color}44`,
            }}
          />
        ) : (
          <div
            className="absolute rounded-full flex items-center justify-center"
            style={{
              width: discSize,
              height: discSize,
              right: -discSize * (1 - discVisibleFraction),
              top: '50%',
              transform: 'translateY(-50%)',
              background: chain.color,
              opacity: 0.7,
              boxShadow: `0 0 10px ${chain.color}44`,
            }}
          >
            <span
              className="font-bold text-white leading-none"
              style={{ fontSize: amountSize, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              {chain.glyph}
            </span>
          </div>
        ))}

      {/* Token amount + symbol — centered over the VISIBLE portion of the
          disc. Visible-portion center sits at `(discVisibleFraction/2) *
          discSize` from the bar's right edge. */}
      <div
        className="absolute flex flex-col items-center leading-none"
        style={{
          right: discSize * discVisibleFraction * 0.5,
          top: '50%',
          transform: 'translate(50%, -50%)',
        }}
      >
        {slotted ? (
          <span
            className="font-bold tracking-wider"
            style={{
              fontSize: amountSize * 0.55,
              background: 'linear-gradient(90deg, #00FFC2, #BC13FE)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ◆ IN CASE
          </span>
        ) : (
          <>
            <span
              className="font-bold text-white tabular-nums leading-none"
              style={{
                fontSize: amountSize,
                textShadow:
                  '0 1px 3px rgba(0,0,0,0.85), 0 0 6px rgba(0,0,0,0.55)',
                letterSpacing: '-0.01em',
              }}
            >
              {payout}
            </span>
            <span
              className="font-semibold text-white tracking-wider leading-none"
              style={{
                fontSize: symbolSize,
                marginTop: 1,
                textShadow:
                  '0 1px 2px rgba(0,0,0,0.80), 0 0 4px rgba(0,0,0,0.50)',
              }}
            >
              {campaign.tokenSymbol}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

