import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { resolveQueueItem, type ResolvedQueueItem } from './queueHelpers';
import { useQueue, dismissFromQueue } from './queueStore';
import { CIRCLE_ACCENT, CIRCLE_ACCENT_BADGE, EINK_ASPECT_RATIO } from './constants';
import { toast } from 'sonner@2.0.3';

interface CircleQueueBrowserProps {
  onBack: () => void;
  initialKey?: string;
  onCast: (item: ResolvedQueueItem) => void;
  // A campaign owns the case — tap-to-cast is disabled until it completes (the
  // tap is blocked upstream; this reflects it in the gesture hint).
  castLocked?: boolean;
}

// How many cards deep the deck shows on each side. Beyond this, cards are
// fully transparent (opacity 0) and get unmounted — so they fade out before
// they pop, rather than snapping.
const WINDOW = 3;

// Resting pose for a card at `offset` positions from the focused (center)
// card. Closer → bigger + more opaque + higher up the stack; further → smaller,
// pushed out sideways, dimmer. This is the whole "scroll a deck" depth cue.
function cardPose(offset: number) {
  const a = Math.abs(offset);
  const dir = Math.sign(offset);
  return {
    x: offset === 0 ? 0 : dir * (60 + (a - 1) * 40),
    scale: Math.max(0.6, 1 - a * 0.13),
    opacity: a === 0 ? 1 : a === 1 ? 0.6 : a === 2 ? 0.3 : 0,
    rotate: offset === 0 ? 0 : dir * -4,
    zIndex: 30 - a,
  };
}

// Where a tossed card ends up — flung up and off, rotating as it goes.
const TOSS_POSE = { x: 0, y: -720, scale: 0.85, rotate: -12, opacity: 0 };

// Drag-up distance past which releasing tosses the card. The warning glow arms
// once the card is dragged into this zone (before release), so it reads as a
// "let go here to dismiss" cue rather than a post-hoc flash.
const TOSS_THRESHOLD = -90;

// Full-screen deck. The focused card sits centered at full size; its neighbors
// peek in from the sides, smaller and dimmer. Swipe left/right scrolls the deck
// (the next card grows into focus, the last one shrinks away); swipe up tosses
// the focused card off the top; tap casts it.
export function CircleQueueBrowser({ onBack, initialKey, onCast, castLocked }: CircleQueueBrowserProps) {
  // Live queue — dismissing a card (toss here, or cast from the preview) mutates
  // the shared store, so the deck, the Cast tab's count badge, and the ribbon
  // tiles all stay in sync.
  const queueRaw = useQueue();
  const items = useMemo(
    () => queueRaw.map(resolveQueueItem).filter(Boolean) as ResolvedQueueItem[],
    [queueRaw],
  );
  const [idx, setIdx] = useState(() => {
    if (!initialKey) return 0;
    const i = items.findIndex((it) => it.key === initialKey);
    return i === -1 ? 0 : i;
  });
  // Key of the card currently being tossed off (drives the exit animation).
  // While set, dragging is disabled so the toss can't be interrupted.
  const [tossingKey, setTossingKey] = useState<string | null>(null);
  // True while the focused card is dragged up into the toss zone — arms the
  // page-edge warning glow before the user releases.
  const [armed, setArmed] = useState(false);
  // Distinguishes a real drag from a tap so a swipe doesn't also fire "cast".
  const movedRef = useRef(false);

  // The store can shrink beneath us (a dismissal) — keep idx in range.
  const safeIdx = Math.min(idx, Math.max(0, items.length - 1));

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar onBack={onBack} label="Circle queue" position="empty" />
        <div className="flex-1 flex items-center justify-center text-soft-3">
          Queue is empty.
        </div>
      </div>
    );
  }

  const current = items[safeIdx];

  const goto = (next: number) => {
    if (next < 0 || next >= items.length || tossingKey) return;
    setIdx(next);
  };

  // Remove the tossed card once its throw animation finishes, then settle the
  // index onto whatever slid into its place. Removal goes through the shared
  // store so the badge and ribbon tiles update too.
  const commitToss = () => {
    const dismissed = items[safeIdx];
    setIdx(Math.max(0, Math.min(safeIdx, items.length - 2)));
    setTossingKey(null);
    if (dismissed) dismissFromQueue(dismissed.key);
    if (dismissed?.source === 'gift' && dismissed.tokenLine) {
      const [amt, sym] = dismissed.tokenLine.replace('+', '').split(' ');
      toast(`Image dismissed. ${amt} ${sym} stays in your wallet.`, { duration: 4200 });
    } else {
      toast('Dismissed', { duration: 3000 });
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setArmed(false);
    if (tossingKey) return;
    const { offset, velocity } = info;
    // Up → toss off.
    if (offset.y < TOSS_THRESHOLD || velocity.y < -650) {
      setTossingKey(current.key);
      return;
    }
    // Left → advance; right → go back.
    if (offset.x < -60 || velocity.x < -400) {
      goto(safeIdx + 1);
      return;
    }
    if (offset.x > 60 || velocity.x > 400) {
      goto(safeIdx - 1);
    }
    // Otherwise the card springs back to center via its `animate` pose.
  };

  const handleCast = () => {
    onCast(current);
  };

  // Only cards within the window get rendered.
  const visible = items
    .map((item, i) => ({ item, i, offset: i - safeIdx }))
    .filter(({ offset }) => Math.abs(offset) <= WINDOW);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Toss warning — the whole page edge flares amber→rose while the focused
          card is dragged up into the toss zone, cueing "let go here to dismiss"
          before release (it clears the moment the card is let go). Hugs all four
          edges (inset glow) and pulses while armed. */}
      <AnimatePresence>
        {armed && (
          <motion.div
            key="toss-warn"
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            {/* Edge-hugging glow: a broad inset shadow rings the frame, with a
                second tighter ring for a hot inner lip. */}
            <motion.div
              className="absolute inset-0"
              style={{
                boxShadow:
                  'inset 0 0 46px 6px rgba(251,146,60,0.65), inset 0 0 120px 34px rgba(244,63,94,0.42)',
              }}
              animate={{ opacity: [0.55, 1, 0.6] }}
              transition={{ duration: 0.52, repeat: Infinity, repeatType: 'mirror' }}
            />
            {/* Corner blooms reinforce the four corners, where a plain inset
                shadow is weakest. */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(60% 40% at 50% 0%, rgba(251,146,60,0.42) 0%, transparent 70%),' +
                  'radial-gradient(60% 40% at 50% 100%, rgba(244,63,94,0.38) 0%, transparent 70%),' +
                  'radial-gradient(40% 60% at 0% 50%, rgba(251,146,60,0.30) 0%, transparent 70%),' +
                  'radial-gradient(40% 60% at 100% 50%, rgba(244,63,94,0.30) 0%, transparent 70%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <TopBar onBack={onBack} label="Circle queue" position={`${safeIdx + 1} of ${items.length}`} />

      <div className="relative flex-1 flex flex-col items-center px-6 pt-6 pb-8 overflow-hidden">
        {/* The deck — every card lands in the same grid cell so they stack; each
            animates to its depth pose. */}
        <div className="relative w-full max-w-sm flex-1 grid place-items-center">
          {visible.map(({ item, i, offset }) => {
            const isCenter = offset === 0;
            const isTossing = tossingKey === item.key;
            const pose = cardPose(offset);
            return (
              <motion.div
                key={item.key}
                className={`col-start-1 row-start-1 w-full ${isCenter ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                style={{ zIndex: isTossing ? 40 : pose.zIndex }}
                initial={false}
                animate={
                  isTossing
                    ? TOSS_POSE
                    : { x: pose.x, y: 0, scale: pose.scale, opacity: pose.opacity, rotate: pose.rotate }
                }
                transition={
                  isTossing
                    ? { duration: 0.42, ease: [0.32, 0, 0.75, 0.15] }
                    : { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }
                }
                onAnimationComplete={isTossing ? commitToss : undefined}
                drag={isCenter && !tossingKey}
                dragElastic={0.6}
                dragMomentum={false}
                onDragStart={() => {
                  movedRef.current = false;
                  setArmed(false);
                }}
                onDrag={(_, info) => {
                  if (Math.abs(info.offset.x) > 8 || Math.abs(info.offset.y) > 8) {
                    movedRef.current = true;
                  }
                  // Arm the warning glow while the card sits in the toss zone —
                  // and disarm if it's dragged back out — so the cue tracks the
                  // gesture rather than firing after the throw.
                  if (isCenter) setArmed(info.offset.y < TOSS_THRESHOLD);
                }}
                onDragEnd={isCenter ? handleDragEnd : undefined}
                onClick={() => {
                  if (isTossing) return;
                  if (isCenter) {
                    if (movedRef.current) {
                      movedRef.current = false;
                      return;
                    }
                    handleCast();
                  } else {
                    goto(i);
                  }
                }}
              >
                <div
                  className="rounded-3xl border border-amber-500/50 dark:border-amber-500/25 p-4 backdrop-blur-md"
                  style={{ background: 'var(--queue-card-bg)' }}
                >
                  {/* Header line */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {item.headline}
                      </div>
                      {item.subheadline && (
                        <div className="text-[11px] text-soft-3 truncate italic">
                          {item.subheadline}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-mono uppercase text-soft-3 flex-shrink-0">
                      {item.timeLabel}
                    </div>
                  </div>
                  <div className="my-2 border-t border-soft-3" />

                  {/* E-ink preview canvas — 528×768 portrait */}
                  <div
                    className="relative mx-auto rounded-xl overflow-hidden bg-[#0a0a0a] ring-1 ring-black/10 dark:ring-white/10"
                    style={{ width: '100%', aspectRatio: `${EINK_ASPECT_RATIO}` }}
                  >
                    <ImageWithFallback
                      src={item.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    <div className="absolute bottom-1 right-2 text-[9px] font-mono text-white/40">
                      528 × 768
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3">
                    {item.tokenLine && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: CIRCLE_ACCENT_BADGE }}
                        />
                        <span className="font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
                          {item.tokenLine}
                        </span>
                      </div>
                    )}
                    {item.note && (
                      <div className="mt-1 text-xs text-soft-2 italic">"{item.note}"</div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Page dots */}
        <div className="mt-6 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goto(i)}
              className={`h-1.5 rounded-full transition-all ${i === safeIdx ? 'w-6' : 'w-1.5'}`}
              style={{ background: i === safeIdx ? CIRCLE_ACCENT : 'color-mix(in srgb, var(--foreground) 16%, transparent)' }}
              aria-label={`Go to ${i + 1}`}
            />
          ))}
        </div>

        {/* Gesture hint strip */}
        <div className="mt-6 text-center text-[11px] text-soft-3 leading-loose">
          <div>← swipe          swipe →</div>
          {castLocked ? (
            <div className="text-amber-400/80">↑ toss    ·    casting paused — campaign active</div>
          ) : (
            <div>↑ toss    ·    tap: cast</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopBar({ onBack, label, position }: { onBack: () => void; label: string; position: string }) {
  return (
    <div className="sticky top-0 z-30 backdrop-blur-md bg-scrim border-b border-glass">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-2 text-foreground">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">{label}</span>
        </button>
        <div className="text-xs font-mono text-soft-3 uppercase tracking-wider">
          {position}
        </div>
      </div>
    </div>
  );
}
