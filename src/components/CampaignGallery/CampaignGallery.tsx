import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, History } from 'lucide-react';
import { WallGrid } from './WallGrid';
import { CardZoomView } from './CardZoomView';
import { ReducedMotionList, usePrefersReducedMotion } from './ReducedMotionList';
import { GALLERY_CAMPAIGNS, type GalleryCampaign } from '../../data/galleryCampaigns';

interface CampaignGalleryProps {
  // Slotted card = the campaign currently displayed on the user's case. Maps to
  // the existing activeCommitment.campaignId so this surface stays in sync with
  // the rest of the app without owning that state.
  slottedCampaignId: number | null;
  // Fires when the user completes the press-and-hold cast sequence. The full
  // campaign + chosen frame index lets App.tsx build an activeCommitment without
  // round-tripping through the AdCampaigns detail flow.
  onCommitCampaign: (campaign: GalleryCampaign, frameIdx: number) => void;
  // Signals to App.tsx when the user has zoomed into a single card. Lets the
  // bottom nav hide while inspecting / casting — the "you're inside an artwork"
  // moment shouldn't compete with global navigation chrome.
  onCardOpenChange?: (open: boolean) => void;
  // Cumulative tokens earned across completed campaigns. Drives the top bar's
  // headline number so the user always sees their total without leaving Earnings.
  totalEarned: number;
  // Opens the campaign history view. Wired through App.tsx so the gallery
  // doesn't need to know about adView routing.
  onShowHistory: () => void;
  // Opens the active campaign's status / commitment page. Triggered by the
  // top bar's IN CAST pill — tapping the live status shouldn't drop the user
  // into the campaign's marketing detail, it should go to "how's this run
  // doing right now?".
  onViewActiveStatus: () => void;
}

// Default Fisher–Yates: deterministic from the time you shuffled, not the data
// shape. Stable enough that re-renders don't re-shuffle behind your back.
function shuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let m = a.length;
  let s = seed;
  while (m) {
    s = (s * 9301 + 49297) % 233280;
    const i = Math.floor((s / 233280) * m--);
    [a[m], a[i]] = [a[i], a[m]];
  }
  return a;
}

const BATCH_SIZE = 24;
// Height of the global bottom nav. We leave this much clear at the bottom of
// the wall so the nav's backdrop-filter samples the ambient page backdrop
// instead of hard-edged drifting cards — matching how the nav reads over
// Cast/Assets (both of which add their own bottom padding for the nav).
const NAV_CLEARANCE = 80;

export function CampaignGallery({
  slottedCampaignId,
  onCommitCampaign,
  onCardOpenChange,
  totalEarned,
  onShowHistory,
  onViewActiveStatus,
}: CampaignGalleryProps) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [openCampaign, setOpenCampaign] = useState<GalleryCampaign | null>(null);

  // Headline earnings number — rendered directly, no count-up animation.
  //
  // Removed in favor of perf: the earlier rAF count-up updated textContent
  // every frame on a node inside the top bar's backdrop-filtered layer,
  // forcing that layer to re-rasterize 60×/sec. On a CPU-throttled mobile
  // device that dropped the page from 75 fps to ~22 fps for the full 2.2 s
  // duration of the count-up — by far the worst perf cost on the Earnings
  // page. A static value + the bar's own fade-in carries enough motion.
  const formatEarned = (v: number) =>
    v.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Stable onOpenCard so WallGrid's prop identity doesn't shift on every
  // render of CampaignGallery — otherwise any state churn here (zoom
  // open/close, etc.) drags the 54-cell wall through reconciliation.
  const handleOpenCard = useCallback((c: GalleryCampaign) => {
    setOpenCampaign(c);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 448, h: 700 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      // Use layout (clientWidth/clientHeight) instead of getBoundingClientRect:
      // App.tsx wraps the whole app in a CSS `scale(...)` transform to fit the
      // viewport, and getBoundingClientRect returns the post-transform visual
      // rect — smaller than the layout box. Passing the visual size to WallGrid
      // makes its inline-width/height shrink under the transform, leaving the
      // wall area underutilized. clientWidth/Height are layout dimensions,
      // unaffected by transforms, so the wall fills the container exactly.
      const w = el.clientWidth;
      const h = el.clientHeight;
      setViewport({ w, h: Math.max(420, h) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The slotted card is always present in the wall, even after reshuffle —
  // spec says the wall doesn't get to lose your active campaign. If the random
  // pick missed it, splice it in at the front.
  const batch = useMemo(() => {
    const shuffled = shuffle(GALLERY_CAMPAIGNS, seed);
    const picked = shuffled.slice(0, BATCH_SIZE);
    if (slottedCampaignId != null && !picked.some((c) => c.id === slottedCampaignId)) {
      const slotted = GALLERY_CAMPAIGNS.find((c) => c.id === slottedCampaignId);
      if (slotted) return [slotted, ...picked.slice(0, BATCH_SIZE - 1)];
    }
    return picked;
  }, [seed, slottedCampaignId]);

  const reshuffle = () => setSeed(Math.floor(Math.random() * 1_000_000));

  // Bubble the "is a card zoomed in" boolean to App.tsx so it can hide the
  // bottom nav while the user is inspecting / casting. We fire on every
  // transition (open ↔ close) and on unmount we make sure we leave it open=false.
  useEffect(() => {
    onCardOpenChange?.(openCampaign != null);
    return () => onCardOpenChange?.(false);
  }, [openCampaign, onCardOpenChange]);

  // Reduced-motion fallback: if the OS reports prefers-reduced-motion, we drop
  // the wall, spotlight, flip, and animated-series auto-play entirely and
  // render a vertical list with tap-to-expand details. The cast handoff still
  // goes through onCommitCampaign so the rest of the app stays consistent.
  const reducedMotion = usePrefersReducedMotion();
  if (reducedMotion) {
    return (
      <ReducedMotionList
        campaigns={batch}
        slottedId={slottedCampaignId}
        onReshuffle={reshuffle}
        onCastCampaign={(c) => onCommitCampaign(c, 0)}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Glassmorphic earnings bar. Mirrors the bottom-nav backdrop on the
          Earnings tab — same emerald accent (#22c55e) leaking in from the left
          edge, same blur + saturate, same fade so the bar reads as the same
          surface family as the global nav. The mask fades out at the bottom so
          the bar dissolves into the wall instead of cutting it with a line. */}
      <div
        className="absolute top-0 left-0 right-0 z-20"
        style={{
          // Top bar previously had `backdrop-filter: blur(14px) saturate(1.5)`
          // sampling the wall behind it. With cards moving during drag, the
          // browser had to re-blur the bar's backdrop every frame — one of
          // the heaviest costs during scroll. Replaced with a denser opaque
          // gradient so the bar still reads as a "glass plate" without the
          // per-frame blur sampling.
          background:
            'radial-gradient(140% 200% at 12.5% 0%, rgba(34,197,94,0.20) 0%, rgba(34,197,94,0.06) 32%, transparent 70%), ' +
            'linear-gradient(to bottom, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.50) 60%, rgba(10,10,10,0) 100%)',
          borderBottom: '1px solid rgba(34,197,94,0.10)',
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%)',
        }}
      >
        <div className="px-4 pt-3 pb-5">
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-white" />
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/80">
                  Total Earned
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                {/* Bump-in on first mount: spring scale with a touch of
                    overshoot, paired with the rAF rolling count-up above so
                    the number feels alive when the user lands on Earnings. */}
                <span className="text-2xl font-bold tabular-nums leading-none text-white inline-block">
                  {formatEarned(totalEarned)}
                </span>
                <span className="text-[11px] font-semibold text-white/80">
                  USD
                </span>
              </div>
            </div>

            {/* Centered IN CAST status — sits in the middle of the top bar so
                the user always sees casting state without crowding the
                earnings number or the action buttons. Short pill: pulsing
                Prism dot + label. Tap opens the slotted campaign. */}
            {slottedCampaignId != null && (() => {
              const c = batch.find((x) => x.id === slottedCampaignId);
              if (!c) return null;
              return (
                <button
                  type="button"
                  onClick={onViewActiveStatus}
                  aria-label={`In cast: ${c.title} — view status`}
                  className="absolute left-1/2 top-1/2 flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full active:scale-[0.97] transition-transform"
                  style={{
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(34,197,94,0.22)',
                    border: '1px solid rgba(34,197,94,0.65)',
                    boxShadow:
                      '0 2px 12px rgba(34,197,94,0.30), 0 0 14px rgba(34,197,94,0.18)',
                  }}
                >
                  <span
                    className="relative flex items-center justify-center"
                    style={{ width: 12, height: 12 }}
                  >
                    <span
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: '#22c55e', opacity: 0.55 }}
                    />
                    <span
                      className="relative rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background: '#22c55e',
                        boxShadow: '0 0 6px rgba(34,197,94,0.85)',
                      }}
                    />
                  </span>
                  <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-white">
                    In Cast
                  </span>
                </button>
              );
            })()}

            <button
              type="button"
              onClick={onShowHistory}
              aria-label="View campaign history"
              className="shrink-0 p-2 rounded-full transition active:scale-95 text-white"
              style={{
                background: 'rgba(34,197,94,0.18)',
                border: '1px solid rgba(34,197,94,0.45)',
                boxShadow: '0 1px 4px rgba(34,197,94,0.20)',
              }}
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Wall fills the entire container so cards drift behind the top bar
          AND the bottom nav, the same way Cast keeps its image content all
          the way down. */}
      <div className="absolute inset-0">
        <WallGrid
          campaigns={batch}
          slottedId={slottedCampaignId}
          viewportW={viewport.w}
          viewportH={viewport.h}
          onOpenCard={handleOpenCard}
        />
      </div>

      {/* Bottom-edge wash. Hard-edged dark cards over a light page bg create
          the chunky blocks the nav's blur picks up. This overlay fades the
          page bg color in from the bottom so the card edges dissolve into a
          low-frequency field by the time they reach the nav strip — same
          kind of soft input the Cast nav samples from its photographic
          backdrop. Pointer-events: none so the wall stays draggable.
          Theme-aware fill via Tailwind's bg-white/dark:bg-[…]; the soft
          fade-in is done with a mask-image gradient. */}
      <div
        aria-hidden="true"
        className="absolute left-0 right-0 bottom-0 pointer-events-none z-10 bg-white dark:bg-[#0A0A0A]"
        style={{
          height: NAV_CLEARANCE,
          maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0,0,0,0.35) 80%, rgba(0,0,0,0.6) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0,0,0,0.35) 80%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      <AnimatePresence>
        {openCampaign && (
          <CardZoomView
            key={openCampaign.id}
            campaign={openCampaign}
            slotted={openCampaign.id === slottedCampaignId}
            onClose={() => setOpenCampaign(null)}
            onCast={(c, frameIdx) => {
              // Cast sequence completed — close the open card and tell App.tsx
              // to register an active commitment for the chosen campaign/frame.
              setOpenCampaign(null);
              onCommitCampaign(c, frameIdx);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
