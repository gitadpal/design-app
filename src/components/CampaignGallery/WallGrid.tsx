import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  animate,
} from 'motion/react';
import type { GalleryCampaign } from '../../data/galleryCampaigns';
import { CampaignCard, type ChromeLevel } from './CampaignCard';

interface WallGridProps {
  campaigns: GalleryCampaign[];
  slottedId: number | null;
  viewportW: number;
  viewportH: number;
  onOpenCard: (campaign: GalleryCampaign) => void;
}

// Waterfall layout. Three packed columns on phone width gives a Pinterest-style
// stagger that reads as cards "drifting in a river" rather than a rigid grid.
const COLS = 3;
const GAP_X = 14;
const GAP_Y = 14;
// Progress footer sits below the image: full-area progress band with big %
// readout + token/duration micro-text. Height estimated for the smallest
// chrome — taller chromes only show up at zoom and transform on top of the
// laid-out cells, so a single estimate is fine.
const STATS_STRIP_EST = 44;

const ZOOM_STEPS: { id: ChromeLevel; scale: number }[] = [
  { id: 'out', scale: 1 },
  { id: 'mid', scale: 1.5 },
  { id: 'in', scale: 2.2 },
];

function computeCellW(viewportW: number) {
  return Math.floor((viewportW - GAP_X * (COLS - 1)) / COLS);
}

// Image area aspect is locked to 5:7 (the e-ink case ratio) per the design
// spec's "true preview" rule. Every card uses the same image dimensions + a
// fixed-height progress footer, so every cell in the grid is the same size —
// no jitter, no waterfall stagger, no clipping when chrome changes.
const IMAGE_ASPECT_H_OVER_W = 7 / 5; // 1.40

// Drift animation (rAF time loop + per-cell sin/cos transforms) was removed —
// at 60 Hz × 54 cells × 2 useTransforms it dominated the idle frame budget
// for a 2–10px sub-pixel sway that wasn't visible at speed. Cards now sit
// still at idle; pan/scale still animate as expected.

const GridCell = ({
  campaign,
  slotted,
  baseX,
  baseY,
  cardW,
  cardH,
  chromeLevel,
  registerCell,
  onOpenCard,
}: {
  campaign: GalleryCampaign;
  slotted: boolean;
  baseX: number;
  baseY: number;
  cardW: number;
  cardH: number;
  chromeLevel: ChromeLevel;
  // Registers the cell's DOM element with the parent's ref map. WallGrid
  // mutates style.filter directly on these refs at scroll start / end —
  // 54 imperative DOM writes per transition instead of 54 React reconciles.
  registerCell: (id: string, el: HTMLElement | null, baseY: number, slotted: boolean) => void;
  // Receives the stable parent callback; the per-cell tap closure is created
  // here with useCallback so React.memo's shallow compare actually holds.
  onOpenCard: (campaign: GalleryCampaign) => void;
}) => {
  // Position is static — `baseX` and `baseY` from layout, applied via plain
  // CSS. The whole wall pans via the parent motion.div's translate.
  //
  // Spotlight filter is set imperatively by WallGrid (see `flushFilters`).
  // The cell renders once with no filter; React never re-renders this cell
  // for scroll-state changes, which is the only way to keep the start-of-
  // drag and end-of-drag frames from spiking on throttled CPU.
  const id = `${baseY}-${baseX}-${campaign.id}`;
  const cellRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    registerCell(id, cellRef.current, baseY, slotted);
    return () => registerCell(id, null, baseY, slotted);
  }, [id, registerCell, baseY, slotted]);

  // Per-cell drift parameters — deterministic from campaign id so reshuffles
  // don't make every card hop to a new phase. Period 7–13s, with a negative
  // delay so cards start mid-cycle (no synchronized rise at mount).
  const idHash = ((campaign.id * 1103515245 + 12345) >>> 0) % 1000;
  const driftDuration = 7 + (idHash / 1000) * 6;
  const driftDelay = -((idHash / 1000) * driftDuration);

  const handleTap = useCallback(() => onOpenCard(campaign), [onOpenCard, campaign]);

  return (
    <div
      ref={cellRef}
      className="absolute"
      style={{
        left: '50%',
        top: 0,
        width: cardW,
        height: cardH,
        marginLeft: -cardW / 2,
        transform: `translate(${baseX}px, ${baseY}px)`,
        // Short opacity transition smooths the dim/bright pop without
        // animating many frames of compositing (compositor-only — no
        // per-layer rasterization, so the cost is negligible).
        transition: 'opacity 120ms ease-out',
        willChange: 'opacity',
      }}
    >
      {/* Drift wrapper — CSS animation runs only when the wall container's
          data-scrolling="false". Animates a 1–4 px translate3d on a separate
          DOM node so the parent's static position transform stays untouched. */}
      <div
        className="card-drift w-full h-full"
        style={{
          animationDuration: `${driftDuration.toFixed(2)}s`,
          animationDelay: `${driftDelay.toFixed(2)}s`,
        }}
      >
        <CampaignCard
          campaign={campaign}
          slotted={slotted}
          chrome={chromeLevel}
          isLit={slotted}
          onTap={handleTap}
        />
      </div>
    </div>
  );
};

// Memoize: WallGrid re-renders on slottedId / zoom / viewport changes; without
// memo all 54 cells reconcile every time. The shallow prop compare holds
// because `registerCell` and `onOpenCard` are useCallback'd at the parent.
const MemoGridCell = memo(GridCell);

export function WallGrid({
  campaigns,
  slottedId,
  viewportW,
  viewportH,
  onOpenCard,
}: WallGridProps) {
  // Hoist the slotted card near the top so it's never below the fold on initial
  // open. The waterfall packer will route it into whichever column is shortest
  // at that point, but order-in-list determines visual priority.
  const ordered = useMemo(() => {
    if (slottedId == null) return campaigns;
    const slotted = campaigns.find((c) => c.id === slottedId);
    if (!slotted) return campaigns;
    const rest = campaigns.filter((c) => c.id !== slottedId);
    rest.splice(2, 0, slotted);
    return rest;
  }, [campaigns, slottedId]);

  // Masonry layout — pack each card into whichever column is currently shortest.
  // The whole wall is centered horizontally so x in cell coords is "offset from
  // viewport midline" (matches GridCell which uses left: 50%).
  const layout = useMemo(() => {
    const cellW = computeCellW(viewportW);
    // Per-lane top offsets — even though every card is the same height, the
    // lanes start at slightly different y so each row reads as three offset
    // cells instead of a hard horizontal stripe. The wrap math below already
    // respects this because totalH = max(cols).
    const COL_TOP_OFFSETS = [0, 28, 14];
    const cols: number[] = COL_TOP_OFFSETS.slice(0, COLS);
    const wallW = COLS * cellW + (COLS - 1) * GAP_X;
    const items: {
      campaign: GalleryCampaign;
      baseX: number;
      baseY: number;
      cardW: number;
      cardH: number;
      col: number;
    }[] = [];

    // Every card is the same height: locked-aspect image + fixed footer. With
    // uniform heights the pack-into-shortest-column algorithm degenerates to a
    // tidy row-by-row grid, which is what we want — no more rag-bottom rows.
    const imgH = cellW * IMAGE_ASPECT_H_OVER_W;
    const cardH = imgH + STATS_STRIP_EST;
    for (const c of ordered) {
      let minCol = 0;
      for (let i = 1; i < COLS; i++) if (cols[i] < cols[minCol]) minCol = i;
      const colLeft = -wallW / 2 + minCol * (cellW + GAP_X);
      items.push({
        campaign: c,
        baseX: colLeft + cellW / 2,
        baseY: cols[minCol],
        cardW: cellW,
        cardH,
        col: minCol,
      });
      cols[minCol] += cardH + GAP_Y;
    }
    const totalH = Math.max(...cols);
    return { items, totalH, cellW, wallW };
  }, [ordered, viewportW]);

  // One masonry pass = "tile". We render the tile three times stacked, and as
  // the user pans across a tile boundary we snap panY by tileH so they're
  // always inside the middle copy. With identical content per copy, the snap
  // is visually invisible — the wall feels infinite even with very few
  // campaigns.
  const tileH = layout.totalH + GAP_Y;

  const panX = useMotionValue(0);
  const panY = useMotionValue(-tileH);
  const scale = useMotionValue(1);

  // Scroll-idle gate for the per-cell spotlight filter.
  //
  // Cells register their DOM element with `registerCell`. On the first
  // panY/scale change after rest the wall is "scrolling" and `flushFilters`
  // writes a uniform mid-bright filter directly to every cell element. After
  // ~180 ms of quiet, the wall is "idle" again and `flushFilters` recomputes
  // each cell's spotlight brightness from the current panY+scale and writes
  // it back. Both sides bypass React entirely: 54 imperative style writes are
  // an order of magnitude cheaper than 54 reconciliations on throttled CPU.
  const cellsRef = useRef<Map<string, { el: HTMLElement; baseY: number; slotted: boolean }>>(
    new Map(),
  );
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollingRef = useRef(false);
  // Ref to the wall container — used to toggle `data-scrolling` imperatively
  // so the CSS `.card-drift` keyframes pause during scroll without touching
  // React state. (Per-cell drift animations are GPU-only.)
  const wallRef = useRef<HTMLDivElement>(null);
  const setWallScrolling = (scrolling: boolean) => {
    if (wallRef.current) {
      wallRef.current.dataset.scrolling = scrolling ? 'true' : 'false';
    }
  };

  // Visual cue uses opacity, not CSS filter. Opacity changes are compositor-
  // only (alpha multiply per layer) — they don't force per-layer re-
  // rasterization the way `filter: brightness/saturate` does. With 54 cells
  // changing simultaneously at scroll-start/end, filter caused 54 paint jobs
  // in one frame and tanked FPS to ~12 on throttled CPU. Opacity keeps the
  // dim-during-scroll / spotlight-at-idle read with zero paint cost.
  const writeCellOpacity = (el: HTMLElement, opacity: number) => {
    el.style.opacity = opacity.toFixed(2);
  };

  const flushFiltersForScroll = () => {
    cellsRef.current.forEach(({ el, slotted: s }) => {
      writeCellOpacity(el, s ? 1 : 0.85);
    });
  };

  const flushFiltersForIdle = () => {
    const py = panY.get();
    const s = scale.get();
    const vw = viewportW;
    const vh = viewportH;
    const radius = Math.min(vw, vh) * 0.85;
    cellsRef.current.forEach(({ el, baseY, slotted: isSlotted }) => {
      // x is locked centred (panX = 0 and baseX feeds straight into transform),
      // so distance only needs the y contribution to estimate spotlight fall-off.
      const screenY = (baseY + (el.clientHeight || 0) / 2) * s + py;
      const dy = screenY - vh / 2;
      const dist = Math.abs(dy);
      const t = Math.min(1, dist / radius);
      const floor = isSlotted ? 1 : 0.55;
      const opacity = floor + (1 - floor) * (1 - t);
      writeCellOpacity(el, opacity);
    });
  };

  const registerCell = useCallback(
    (id: string, el: HTMLElement | null, baseY: number, slotted: boolean) => {
      if (el) {
        cellsRef.current.set(id, { el, baseY, slotted });
        // New cell — paint its opacity once based on current state so it
        // doesn't flash full-bright on mount.
        if (scrollingRef.current) {
          writeCellOpacity(el, slotted ? 1 : 0.85);
        } else {
          const py = panY.get();
          const s = scale.get();
          const radius = Math.min(viewportW, viewportH) * 0.85;
          const screenY = (baseY + (el.clientHeight || 0) / 2) * s + py;
          const dy = screenY - viewportH / 2;
          const dist = Math.abs(dy);
          const t = Math.min(1, dist / radius);
          const floor = slotted ? 1 : 0.55;
          writeCellOpacity(el, floor + (1 - floor) * (1 - t));
        }
      } else {
        cellsRef.current.delete(id);
      }
    },
    [panY, scale, viewportW, viewportH],
  );

  // Idle detection without per-frame timer churn.
  //
  // Naively `armIdle` cleared+set a 180 ms timeout on every panY change —
  // that's ~120 timer ops/second during a drag. We now record the last motion
  // time in a ref and use a *single* self-rearming timer that checks whether
  // 180 ms of quiet have actually elapsed; if not, it sleeps for the
  // remaining window and re-checks. One timer per scroll burst, not per
  // frame.
  const lastMotionAtRef = useRef(0);
  const scheduleIdleCheck = (delay: number) => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      const elapsed = performance.now() - lastMotionAtRef.current;
      if (elapsed >= 180) {
        scrollingRef.current = false;
        setWallScrolling(false);
        flushFiltersForIdle();
        idleTimerRef.current = null;
      } else {
        scheduleIdleCheck(180 - elapsed);
      }
    }, delay);
  };

  const noteMotion = () => {
    lastMotionAtRef.current = performance.now();
    if (!scrollingRef.current) {
      scrollingRef.current = true;
      setWallScrolling(true);
      flushFiltersForScroll();
      scheduleIdleCheck(180);
    }
  };

  // Single listener on scale — used only for pinch, not for drag. Drag's
  // panY listener below also calls noteMotion(), so we don't subscribe a
  // separate second listener on panY just for idle tracking.
  useMotionValueEvent(scale, 'change', noteMotion);

  useEffect(() => () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  // Re-anchor pan into the middle tile when tileH changes (e.g., reshuffle or
  // viewport resize changed card heights). Without this, the wrap thresholds
  // would mismatch the rendered tiles and the wall would jump.
  useEffect(() => {
    panY.set(-tileH);
  }, [tileH, panY]);

  // Single panY listener — does both idle tracking (noteMotion) and tile
  // wrap. Merging them avoids motion's per-listener overhead being paid
  // twice per frame.
  useMotionValueEvent(panY, 'change', (v) => {
    noteMotion();
    const s = scale.get();
    const T = tileH * s;

    if (v > 0) {
      panY.set(v - T);
    } else if (v < -2 * T) {
      panY.set(v + T);
    }
  });

  const [zoomIdx, setZoomIdx] = useState(0);
  const chromeLevel = ZOOM_STEPS[zoomIdx].id;

  // Horizontal pan is locked (3 columns fill the viewport width). Vertical is
  // unbounded — the wrap effect above keeps the visible range inside the
  // rendered tiles, so giant numbers here just keep motion's elastic happy.
  const dragConstraints = useMemo(() => ({
    left: 0,
    right: 0,
    top: -1e6,
    bottom: 1e6,
  }), []);

  const lastTapRef = useRef<number>(0);
  const tapStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ dist: number; scale: number } | null>(null);

  const onPointerDown = (e: { clientX: number; clientY: number; pointerId?: number }) => {
    tapStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    if (e.pointerId != null) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointersRef.current.size === 2) {
        const pts: { x: number; y: number }[] = Array.from(pointersRef.current.values()) as any;
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartRef.current = { dist, scale: scale.get() };
      }
    }
  };
  const onPointerMove = (e: { clientX: number; clientY: number; pointerId?: number }) => {
    if (e.pointerId == null) return;
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const start = pinchStartRef.current;
    if (pointersRef.current.size >= 2 && start) {
      const pts: { x: number; y: number }[] = Array.from(pointersRef.current.values()) as any;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const next = Math.max(0.8, Math.min(3.0, start.scale * (dist / start.dist)));
      scale.set(next);
    }
  };
  const finishPinch = () => {
    const cur = scale.get();
    let bestIdx = 0;
    let bestDelta = Infinity;
    ZOOM_STEPS.forEach((s, i) => {
      const d = Math.abs(s.scale - cur);
      if (d < bestDelta) { bestDelta = d; bestIdx = i; }
    });
    setZoomIdx(bestIdx);
    pinchStartRef.current = null;
  };
  const onPointerUp = (e: { clientX: number; clientY: number; pointerId?: number }) => {
    const start = tapStartRef.current;
    tapStartRef.current = null;
    if (e.pointerId != null && pointersRef.current.has(e.pointerId)) {
      pointersRef.current.delete(e.pointerId);
      if (pinchStartRef.current && pointersRef.current.size < 2) {
        finishPinch();
        return;
      }
    }
    if (!start || pinchStartRef.current) return;
    const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (moved > 6 || Date.now() - start.t > 220) return;
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      const nextIdx = (zoomIdx + 1) % ZOOM_STEPS.length;
      setZoomIdx(nextIdx);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  useEffect(() => {
    animate(scale, ZOOM_STEPS[zoomIdx].scale, {
      type: 'spring',
      stiffness: 280,
      damping: 30,
    });
  }, [zoomIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="relative overflow-hidden touch-none select-none"
      style={{ width: viewportW, height: viewportH }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Spotlight overlay — pure CSS replacement for the per-cell brightness
          filter that used to dim off-center cards. Three stacked layers:
          (1) a soft cyan "stage light" at the centre, (2) a hard vignette that
          fades to ~80% black at the corners so edge cards visibly recede, and
          (3) a tighter inner ring that lifts the spotlight zone a touch above
          the wall's ambient brightness. No subscribers, no per-frame work —
          the GPU composites it once and rides scroll for free. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% 48%, rgba(0,255,194,0.10) 0%, rgba(0,0,0,0) 60%), ' +
            'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 55%), ' +
            'radial-gradient(ellipse 95% 80% at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.82) 100%)',
        }}
      />

      <motion.div
        className="absolute inset-0"
        drag="y"
        dragMomentum
        dragConstraints={dragConstraints}
        dragElastic={0.05}
        // Crank inertia past motion's defaults so a hard flick really carries.
        // power: how much velocity feeds into projected distance (default 0.8).
        // timeConstant: how long the deceleration tail lasts in ms (default 750).
        // Together: a fast finger throws the wall ~2x further than the default
        // and the long tail glides to a stop instead of stopping abruptly.
        dragTransition={{
          power: 1.6,
          timeConstant: 1400,
          modifyTarget: (t) => t,
        }}
        style={{ x: panX, y: panY }}
      >
        <motion.div
          ref={wallRef}
          data-scrolling="false"
          className="absolute left-0 right-0"
          style={{
            top: 0,
            transformOrigin: `50% ${viewportH / 2}px`,
            scale,
            willChange: 'transform',
          }}
        >
          {[0, 1, 2].map((tileIdx) =>
            layout.items.map((it) => (
              <MemoGridCell
                key={`${tileIdx}-${it.campaign.id}`}
                campaign={it.campaign}
                slotted={it.campaign.id === slottedId}
                baseX={it.baseX}
                baseY={it.baseY + tileIdx * tileH}
                cardW={it.cardW}
                cardH={it.cardH}
                chromeLevel={chromeLevel}
                registerCell={registerCell}
                onOpenCard={onOpenCard}
              />
            ))
          )}
        </motion.div>
      </motion.div>

    </div>
  );
}
