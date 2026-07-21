import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ZoomIn, Move } from 'lucide-react';
import { Slider } from './ui/slider';

// Imperative handle: the parent bakes the current crop into a 528×768 data URL
// at cast time. Returns null when the source can't be read to a canvas (e.g. a
// cross-origin image without CORS headers) so the caller can fall back to the
// original url.
export interface CropStageHandle {
  bake: () => string | null;
}

interface CropStageProps {
  src: string;
  // Theme accent (the origin page's color) — tints the interaction affordances.
  accent: string;
  // Optional gradient drawn as a 2px ring around the crop frame (not the slider).
  ringGradient?: string;
  // Target canvas / frame aspect. Defaults to the e-ink portrait 528×768.
  targetW?: number;
  targetH?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Geometry for a cover-fit crop with pan (`center`, normalised focal point in
// [0,1]) and `zoom` (≥1). Everything below derives from the image's natural
// size and the target aspect, so the on-screen preview and the baked canvas
// stay in exact agreement.
function computeGeo(
  iw: number,
  ih: number,
  zoom: number,
  center: { x: number; y: number },
  tw: number,
  th: number,
) {
  const coverScale = Math.max(tw / iw, th / ih);
  const scale = coverScale * zoom;
  // Visible source window (image px) that maps onto the whole frame.
  const srcW = tw / scale;
  const srcH = th / scale;
  const halfX = srcW / 2 / iw;
  const halfY = srcH / 2 / ih;
  // Clamp the focal point so the window never leaves the image.
  const cx = clamp(center.x, halfX, 1 - halfX);
  const cy = clamp(center.y, halfY, 1 - halfY);
  const sx = cx * iw - srcW / 2;
  const sy = cy * ih - srcH / 2;
  return {
    scale,
    srcW,
    srcH,
    sx,
    sy,
    cx,
    cy,
    // CSS box for the <img>, expressed as % of the frame so it needs no measured px.
    imgWPct: (iw * scale) / tw * 100,
    imgHPct: (ih * scale) / th * 100,
    leftPct: (-sx * scale) / tw * 100,
    topPct: (-sy * scale) / th * 100,
  };
}

// An interactive crop window: drag to reposition, slider to zoom. Used by the
// Cast Preview to let the user frame a poster before it's written to the e-ink
// display. Campaign ads are fixed-composition and never mount this.
export const CropStage = forwardRef<CropStageHandle, CropStageProps>(function CropStage(
  { src, accent, ringGradient, targetW = 528, targetH = 768 },
  ref,
) {
  const frameRef = useRef<HTMLDivElement>(null);
  // A same-origin/CORS-enabled copy used only for baking to canvas.
  const bakeImg = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const drag = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);

  // Reset transform and kick off a CORS image load for baking whenever the
  // source changes.
  useEffect(() => {
    setNat(null);
    setZoom(1);
    setCenter({ x: 0.5, y: 0.5 });
    bakeImg.current = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      bakeImg.current = img;
    };
    img.onerror = () => {
      bakeImg.current = null;
    };
    img.src = src;
  }, [src]);

  const geo = nat ? computeGeo(nat.w, nat.h, zoom, center, targetW, targetH) : null;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!geo) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      drag.current = { px: e.clientX, py: e.clientY, cx: geo.cx, cy: geo.cy };
    },
    [geo],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      const frame = frameRef.current;
      if (!d || !frame || !geo) return;
      const fw = frame.clientWidth;
      const fh = frame.clientHeight;
      // Pixels the image spans on screen — dragging one image-width moves the
      // focal point across the whole image.
      const imgWpx = (fw * geo.imgWPct) / 100;
      const imgHpx = (fh * geo.imgHPct) / 100;
      const dx = e.clientX - d.px;
      const dy = e.clientY - d.py;
      setCenter({
        x: d.cx - dx / imgWpx,
        y: d.cy - dy / imgHpx,
      });
    },
    [geo],
  );

  const endDrag = useCallback(() => {
    drag.current = null;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      bake: () => {
        const img = bakeImg.current;
        if (!img || !nat) return null;
        const g = computeGeo(nat.w, nat.h, zoom, center, targetW, targetH);
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        try {
          ctx.drawImage(img, g.sx, g.sy, g.srcW, g.srcH, 0, 0, targetW, targetH);
          return canvas.toDataURL('image/png');
        } catch {
          // Tainted canvas — let the caller keep the original image.
          return null;
        }
      },
    }),
    [nat, zoom, center, targetW, targetH],
  );

  const frame = (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`relative w-full aspect-[11/16] overflow-hidden ${ringGradient ? 'rounded-[15px]' : 'rounded-2xl'} bg-black touch-none cursor-grab active:cursor-grabbing select-none`}
    >
        <img
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) =>
            setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
          className={geo ? 'absolute max-w-none pointer-events-none' : 'absolute inset-0 w-full h-full object-cover pointer-events-none'}
          style={
            geo
              ? {
                  width: `${geo.imgWPct}%`,
                  height: `${geo.imgHPct}%`,
                  left: `${geo.leftPct}%`,
                  top: `${geo.topPct}%`,
                }
              : undefined
          }
        />

        {/* Rule-of-thirds guides + drag affordance, shown only while a crop is
            possible (image loaded). Non-interactive. */}
        {geo && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/12" />
              ))}
            </div>
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-white backdrop-blur-sm"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            >
              <Move className="w-3 h-3" style={{ color: accent }} />
              Drag to reposition
            </div>
          </div>
        )}
    </div>
  );

  return (
    <div>
      {ringGradient ? (
        <div className="rounded-2xl p-[2px]" style={{ background: ringGradient }}>
          {frame}
        </div>
      ) : (
        frame
      )}

      {/* Zoom control */}
      <div className="flex items-center gap-3 mt-3 px-1">
        <ZoomIn className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
        <Slider
          value={[zoom]}
          min={1}
          max={3}
          step={0.01}
          onValueChange={(v) => setZoom(v[0] ?? 1)}
          aria-label="Zoom"
          className="flex-1"
        />
        <span className="text-[11px] font-mono tabular-nums text-soft-3 w-9 text-right">
          {zoom.toFixed(1)}×
        </span>
      </div>
    </div>
  );
});
