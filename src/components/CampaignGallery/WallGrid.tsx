import { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  animate,
} from 'motion/react';
import type { MotionValue } from 'motion/react';
import type { GalleryCampaign } from '../../data/galleryCampaigns';
import { CampaignCard, type ChromeLevel } from './CampaignCard';

const LIT_THRESHOLD = 0.88;

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

// Per-lane drag-speed multipliers. Whichever lane the user's touch lands in
// becomes the "leader" — it scrolls faster than the other two so each column
// reads as its own current with the touched one out front. Small delta keeps
// the wall coherent (the touched lane doesn't run away).
const LANE_SPEED_LEAD = 1.18;
const LANE_SPEED_FOLLOW = 0.9;

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

// Slow continuous drift — each card bobs on its own phase so the wall looks
// like stars in a slow galaxy river: never reorders, never collides, but never
// truly still either. Frequencies in the ~10–25s range so motion is felt, not
// noticed. Amplitudes ~half a gap so neighbors don't visibly touch.
function driftFor(id: number) {
  const h = (a: number, b: number) => ((id * a) + b) % 233280;
  const u = (a: number, b: number) => h(a, b) / 233280; // 0..1
  return {
    ampX: 2 + u(7853, 2917) * 4,                  // 2..6 px
    ampY: 4 + u(3571, 8123) * 6,                  // 4..10 px
    phaseX: u(2143, 6271) * Math.PI * 2,
    phaseY: u(5419, 1031) * Math.PI * 2,
    freqY: 0.04 + u(4877, 5479) * 0.04,           // 12.5–25s period
    freqX: 0.03 + u(1297, 9871) * 0.03,           // 16–33s period
  };
}

function GridCell({
  campaign,
  slotted,
  baseX,
  baseY,
  cardW,
  cardH,
  panX,
  panY,
  panYLane,
  scale,
  time,
  chromeLevel,
  viewportW,
  viewportH,
  onTap,
}: {
  campaign: GalleryCampaign;
  slotted: boolean;
  baseX: number;
  baseY: number;
  cardW: number;
  cardH: number;
  panX: MotionValue<number>;
  panY: MotionValue<number>;
  // Per-lane effective pan. World y of the cell = scale × baseY + panYLane.
  // Equal to panY when no lane is leading; deviates when the touched lane
  // pulls ahead.
  panYLane: MotionValue<number>;
  scale: MotionValue<number>;
  time: MotionValue<number>;
  chromeLevel: ChromeLevel;
  viewportW: number;
  viewportH: number;
  onTap: () => void;
}) {
  const d = driftFor(campaign.id);

  // x position is just drift + base; the parent container's translate-x handles
  // global pan (panX is locked to 0 anyway).
  const x = useTransform(time, (t) => baseX + Math.sin(t * 2 * Math.PI * d.freqX + d.phaseX) * d.ampX);
  // y combines resting position, drift, and the lane-vs-global pan delta. The
  // delta is divided by scale because it's applied inside the scaled wrapper:
  // the parent translate is `+panY` in world coords, but cells inside the
  // scale wrapper need their own contribution in cell coords (pre-scale).
  // Net world y = scale × (baseY + drift) + panYLane.
  const y = useTransform([time, panY, panYLane, scale], (raw) => {
    const [t, py, ply, s] = raw as [number, number, number, number];
    const drift = Math.sin(t * 2 * Math.PI * d.freqY + d.phaseY) * d.ampY;
    return baseY + drift + (ply - py) / s;
  });

  const brightness = useTransform([panX, panYLane, scale], (raw) => {
    const [px, ply, s] = raw as [number, number, number];
    const screenX = viewportW / 2 + baseX * s + px;
    const screenY = (baseY + cardH / 2) * s + ply;
    const dx = screenX - viewportW / 2;
    const dy = screenY - viewportH / 2;
    const dist = Math.hypot(dx, dy);
    // Spotlight radius — wider than the geometric centre so a broader band of
    // cards passes the lit threshold and the viewport always carries a few
    // bright neighbours, not just the dead-centre card.
    const radius = Math.min(viewportW, viewportH) * 0.85;
    const t = Math.min(1, dist / radius);
    const floor = slotted ? 0.95 : 0.55;
    return floor + (1 - floor) * (1 - t);
  });
  const filter = useTransform(brightness, (b) => `brightness(${b}) saturate(${0.5 + 0.5 * b})`);

  const [isLit, setIsLit] = useState(false);
  useMotionValueEvent(brightness, 'change', (v) => {
    const lit = v >= LIT_THRESHOLD;
    setIsLit((prev) => (prev === lit ? prev : lit));
  });

  return (
    <motion.div
      className="absolute"
      style={{
        left: '50%',
        top: 0,
        width: cardW,
        height: cardH,
        marginLeft: -cardW / 2,
        x,
        y,
        filter,
      }}
    >
      <CampaignCard
        campaign={campaign}
        slotted={slotted}
        chrome={chromeLevel}
        isLit={isLit}
        onTap={onTap}
      />
    </motion.div>
  );
}

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

  // Per-lane y. Each lane carries its own scroll position, wrapped to the same
  // (-2T, 0] window panY uses. The drag updates panY; we mirror panY's delta
  // into each lane multiplied by that lane's speed and wrap independently.
  // Storing lane y directly (instead of deriving it as `speed × panY + offset`)
  // is what keeps the wall coherent: drift between lanes is bounded by the
  // wrap, so the rendered tile copies always cover the viewport.
  const laneY0 = useMotionValue(-tileH);
  const laneY1 = useMotionValue(-tileH);
  const laneY2 = useMotionValue(-tileH);
  const laneYs = [laneY0, laneY1, laneY2];

  // Per-lane speed multipliers — touched lane gets LANE_SPEED_LEAD, others
  // LANE_SPEED_FOLLOW, released back to 1 on pointer-up.
  const laneSpeed0 = useMotionValue(1);
  const laneSpeed1 = useMotionValue(1);
  const laneSpeed2 = useMotionValue(1);
  const laneSpeeds = [laneSpeed0, laneSpeed1, laneSpeed2];

  const panYLanes = laneYs;

  // Switch which lane leads. Just updates speed multipliers — no offset math
  // because lane y is its own state, not derived from panY × speed. The lane
  // simply starts consuming subsequent panY deltas at the new rate.
  const setFocusedLane = (lead: number | null) => {
    for (let i = 0; i < COLS; i++) {
      const target =
        lead == null ? 1 : i === lead ? LANE_SPEED_LEAD : LANE_SPEED_FOLLOW;
      laneSpeeds[i].set(target);
    }
  };

  // Track the last panY value we've consumed so we can compute deltas inside
  // the change handler. The wrap branches pre-update this ref so the recursive
  // change handler triggered by panY.set sees delta = 0 and doesn't re-feed
  // the lanes.
  const lastPanYRef = useRef(-tileH);

  // Re-anchor pan into the middle tile when tileH changes (e.g., reshuffle or
  // viewport resize changed card heights). Without this, the wrap thresholds
  // would mismatch the rendered tiles and the wall would jump.
  useEffect(() => {
    panY.set(-tileH);
    laneY0.set(-tileH);
    laneY1.set(-tileH);
    laneY2.set(-tileH);
    lastPanYRef.current = -tileH;
  }, [tileH, panY, laneY0, laneY1, laneY2]);

  // Wrap a lane y back into the (-2T, 0] window. Cheap fixed-iteration loop —
  // a single drag event can never overshoot by more than a few tiles.
  const wrapLaneY = (y: number, T: number): number => {
    let r = y;
    while (r > 0) r -= T;
    while (r < -2 * T) r += T;
    return r;
  };

  // Wrap panY across tile boundaries AND propagate the panY delta into each
  // lane scaled by that lane's speed.
  useMotionValueEvent(panY, 'change', (v) => {
    const s = scale.get();
    const T = tileH * s;
    const delta = v - lastPanYRef.current;
    lastPanYRef.current = v;

    // Feed delta × speed into each lane, then wrap each lane independently.
    if (delta !== 0) {
      for (let i = 0; i < COLS; i++) {
        const next = laneYs[i].get() + delta * laneSpeeds[i].get();
        laneYs[i].set(wrapLaneY(next, T));
      }
    }

    // Wrap global panY. Pre-update lastPanYRef so the recursive call sees
    // delta = 0 and doesn't re-feed lanes.
    if (v > 0) {
      lastPanYRef.current = v - T;
      panY.set(v - T);
    } else if (v < -2 * T) {
      lastPanYRef.current = v + T;
      panY.set(v + T);
    }
  });

  // Shared clock for drift. rAF-driven so every cell reads the same t and stays
  // in phase relationships across renders.
  const time = useMotionValue(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      time.set((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [time]);

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Translate a viewport-space clientX into a column index (0..COLS-1). The
  // wall is centered horizontally inside the container and may be scaled.
  const laneFromClientX = (clientX: number): number => {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const s = scale.get();
    const xRelMid = (clientX - (rect.left + rect.width / 2)) / s;
    const cellW = layout.cellW;
    const xFromWallStart = xRelMid + layout.wallW / 2;
    const lane = Math.floor(xFromWallStart / (cellW + GAP_X));
    return Math.max(0, Math.min(COLS - 1, lane));
  };

  const onPointerDown = (e: { clientX: number; clientY: number; pointerId?: number }) => {
    tapStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    if (e.pointerId != null) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointersRef.current.size === 2) {
        const pts: { x: number; y: number }[] = Array.from(pointersRef.current.values()) as any;
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartRef.current = { dist, scale: scale.get() };
        // Pinch in progress — don't bias lanes.
        setFocusedLane(null);
        return;
      }
    }
    // First-finger touch sets the lead lane. Subsequent drags inherit it until
    // pointerup or another pointerdown changes it.
    setFocusedLane(laneFromClientX(e.clientX));
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
    // When no fingers remain, release the lane bias. The continuity math means
    // the wall doesn't snap; lanes just stop diverging from the global pan.
    if (pointersRef.current.size === 0) setFocusedLane(null);
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
      ref={containerRef}
      className="relative overflow-hidden touch-none select-none"
      style={{ width: viewportW, height: viewportH }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,255,194,0.08) 0%, rgba(0,0,0,0) 55%),' +
            'radial-gradient(ellipse 110% 90% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)',
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
              <GridCell
                key={`${tileIdx}-${it.campaign.id}`}
                campaign={it.campaign}
                slotted={it.campaign.id === slottedId}
                baseX={it.baseX}
                baseY={it.baseY + tileIdx * tileH}
                cardW={it.cardW}
                cardH={it.cardH}
                panX={panX}
                panY={panY}
                panYLane={panYLanes[it.col]}
                scale={scale}
                time={time}
                chromeLevel={chromeLevel}
                viewportW={viewportW}
                viewportH={viewportH}
                onTap={() => onOpenCard(it.campaign)}
              />
            ))
          )}
        </motion.div>
      </motion.div>

    </div>
  );
}
