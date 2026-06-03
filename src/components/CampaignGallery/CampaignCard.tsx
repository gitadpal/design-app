import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Clock } from 'lucide-react';
import type { GalleryCampaign } from '../../data/galleryCampaigns';
import { PAYOUT_RANGE } from '../../data/galleryCampaigns';
import { CHAINS } from './chainColors';
import { ChainLogo } from './ChainLogo';
import { formatPayout } from './formatPayout';

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
          {/* Animated series cross-fade frames in place. objectFit:'cover' is
              forced inline so the poster always fills the 5:7 cell without
              stretching — posters in the wild may be 848×1264 (~0.67 ratio)
              vs the cell's 5/7 (~0.71), so we crop a hair top/bottom rather
              than distort. */}
          {hasFrames ? (
            campaign.frames!.map((f, i) => (
              <img
                key={i}
                src={f.image}
                alt={campaign.title}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                loading="lazy"
                style={{
                  objectFit: 'cover',
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
              style={{ objectFit: 'cover', filter: 'contrast(1.04) brightness(0.96)' }}
            />
          )}

          {/* IN CAST overlay — slotted cards get a prominent, full-image stamp
              so the user can spot which card is currently casting at a glance.
              Mirrors the IN CAST language used elsewhere (ImageCasting,
              CampaignGallery top bar): Prism-tinted scrim + shimmer sweep,
              pulsing emerald dot, bold uppercase label centered over the
              artwork. The original tiny "◆ IN CASE" chip in the reward footer
              was easy to miss against the colorful Prism fill. */}
          {slotted && (
            <>
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(0,255,194,0.30) 0%, rgba(188,19,254,0.34) 100%)',
                  mixBlendMode: 'multiply',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'rgba(0,0,0,0.62)',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(60% 40% at 50% 42%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none overflow-hidden"
              >
                <div
                  className="absolute inset-y-0 w-1/2 in-cast-shimmer"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
                  }}
                />
              </div>
              <div
                className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
              >
                <span
                  className="relative flex items-center justify-center"
                  style={{
                    width: tight ? 12 : chrome === 'mid' ? 16 : 20,
                    height: tight ? 12 : chrome === 'mid' ? 16 : 20,
                  }}
                >
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: '#00FFC2', opacity: 0.75 }}
                  />
                  <span
                    className="relative rounded-full"
                    style={{
                      width: tight ? 7 : chrome === 'mid' ? 9 : 11,
                      height: tight ? 7 : chrome === 'mid' ? 9 : 11,
                      background: '#00FFC2',
                      boxShadow:
                        '0 0 10px rgba(0,255,194,1), 0 0 18px rgba(0,255,194,0.7)',
                    }}
                  />
                </span>
                <span
                  className="font-black uppercase text-white leading-none whitespace-nowrap"
                  style={{
                    fontSize: tight ? 22 : chrome === 'mid' ? 32 : 42,
                    letterSpacing: '0.06em',
                    textShadow:
                      '0 2px 10px rgba(0,0,0,0.85), 0 0 14px rgba(0,255,194,0.6), 0 0 22px rgba(188,19,254,0.45)',
                  }}
                >
                  IN CAST
                </span>
              </div>
            </>
          )}

          {/* Bottom title overlay — small portion of the image so the title is
              legible over any artwork. The overlay sits *inside* the image
              area so we don't change the 5:7 ratio. Originally used
              backdrop-filter blur for the glass effect, but at 54 simultaneous
              cards (3 tile copies × ~18 campaigns) that's 54 blur regions —
              the biggest paint cost on the wall. Swapped to a denser opaque
              gradient + textShadow on the title for legibility at no GPU cost. */}
          <div
            className="absolute left-0 right-0 bottom-0 pointer-events-none flex items-end"
            style={{
              height: tight ? '34%' : '30%',
              background:
                'linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.72) 55%, rgba(10,10,10,0.92) 100%)',
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
                  on the title row. Borderless light pill; a soft outer
                  box-shadow bleeds the chip's edge into the surrounding
                  overlay so it dissolves at its perimeter. Backdrop-blur was
                  removed (another per-card cost at scale) — the chip sits
                  on top of the opaque gradient anyway, so the blur was barely
                  contributing visually. */}
              <div
                className="flex items-center gap-0.5 shrink-0 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  padding: tight ? '1.5px 5px' : '2px 6px',
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
  // Chain logo medallion — large dim backdrop behind the reward amount.
  // Anchored to the bar's TOP so it only spills downward (past the card's
  // rounded bottom edge, clipped by the outer card overflow) and slightly
  // past the right edge — never upward into the image above the bar.
  const discSize = height * 1.9;
  // How far the disc pokes past the bar's right edge.
  const discRightOverflow = discSize * 0.18;

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
      {/* Chain logo medallion — rendered FIRST (lowest in stack order) so the
          progress fill paints OVER it. When the remaining-pool fill reaches
          across to the right side of the bar, it visually masks the disc in
          the "remaining" zone and the user reads the progress at a glance.
          The disc only shows through where the bar isn't filled (the
          depleted portion). Monochrome inline SVG colored via Tailwind's
          dark/light text classes, so it reads light on dark and dark on
          light without swapping assets. Anchored to the bar's top so it
          never spills upward over the image. */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          width: discSize,
          height: discSize,
          right: -discRightOverflow,
          top: -discSize * 0.2,
          // The colored PNG already brings its own brand-color contrast; we
          // dim it well below half so it reads as a quiet watermark behind
          // the reward text rather than competing with it.
          opacity: 0.35,
        }}
      >
        <ChainLogo
          chainId={campaign.chain}
          className="rounded-full"
          style={{ width: discSize, height: discSize }}
        />
      </div>

      {/* Progress fill — width = remaining percent. As the pool drains, the
          colored area visibly retreats from the right, gradually exposing the
          chain medallion behind it. */}
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

      {/* Token amount + symbol — overlaid on the medallion, right-aligned to
          the bar's inner edge with padX margin. `formatPayout` rescales the
          amount so users always read a "many" number: sub-1 amounts get
          bumped to mUSDC / μETH / nETH, and ≥1k amounts collapse to K / M
          with the scale letter promoted to amount-size next to the number. */}
      {(() => {
        const { value, scale, unit } = formatPayout(payout, campaign.tokenSymbol);
        return (
          <div
            className="absolute flex flex-col items-end leading-none"
            style={{
              right: padX,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <span
              className="font-bold text-white tabular-nums leading-none"
              style={{
                fontSize: amountSize,
                textShadow:
                  '0 1px 3px rgba(0,0,0,0.85), 0 0 6px rgba(0,0,0,0.55)',
                letterSpacing: '-0.01em',
              }}
            >
              {value}
              {scale && (
                // Slightly larger, accent-colored, with a small glow so the
                // K / M reads as "big number" punctuation rather than
                // ordinary letter-sized text.
                <span
                  style={{
                    fontSize: amountSize * 1.05,
                    marginLeft: 1,
                    color: accent,
                    textShadow: `0 0 6px ${accent}66, 0 1px 2px rgba(0,0,0,0.8)`,
                    fontWeight: 900,
                  }}
                >
                  {scale}
                </span>
              )}
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
              {unit}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

