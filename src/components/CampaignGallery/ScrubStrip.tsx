import { useRef } from 'react';
import type { CampaignFrame } from '../../data/galleryCampaigns';

interface ScrubStripProps {
  frames: CampaignFrame[];
  activeIdx: number;
  onScrub: (idx: number) => void;
}

// Compact scrub strip: payout sparkline + per-frame thumb track. Sized to fit
// directly beneath the e-ink slot on the detail page (≈ 168px wide). No frame
// counter or shuffle button — the active frame is what the user sees in the
// case preview above, which is the only readout they need while scrubbing.
export function ScrubStrip({ frames, activeIdx, onScrub }: ScrubStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const maxPayout = Math.max(...frames.map((f) => f.tokensPerCast));
  const minPayout = Math.min(...frames.map((f) => f.tokensPerCast));
  const range = Math.max(1, maxPayout - minPayout);

  // Pointer-driven scrub. We compute the active index from the pointer's x
  // position over the track, snapping to the nearest frame thumb.
  const seekFromX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const idx = Math.round(t * (frames.length - 1));
    if (idx !== activeIdx) onScrub(idx);
  };

  return (
    <div className="w-full select-none">
      {/* Compact sparkline — one short bar per frame, height = payout. */}
      <div className="flex items-end gap-[3px] h-6 mb-1 px-0.5">
        {frames.map((f, i) => {
          const norm = (f.tokensPerCast - minPayout) / range;
          const h = 10 + norm * 14; // 10–24px
          const isActive = i === activeIdx;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: h,
                background: isActive
                  ? 'linear-gradient(to top, #00FFC2, rgba(0,255,194,0.4))'
                  : 'rgba(255,255,255,0.18)',
                boxShadow: isActive ? '0 0 6px rgba(0,255,194,0.55)' : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Pointer-draggable track with one thumb per frame. */}
      <div
        ref={trackRef}
        className="relative h-4 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-sm touch-none"
        onPointerDown={(e) => {
          (e.currentTarget as any).setPointerCapture?.(e.pointerId);
          seekFromX(e.clientX);
        }}
        onPointerMove={(e) => {
          if ((e.buttons & 1) === 0) return;
          seekFromX(e.clientX);
        }}
        onPointerUp={(e) => {
          (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
        }}
      >
        {frames.map((_, i) => {
          const t = frames.length <= 1 ? 0.5 : i / (frames.length - 1);
          const isActive = i === activeIdx;
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none transition-all"
              style={{
                left: `${t * 100}%`,
                width: isActive ? 12 : 5,
                height: isActive ? 12 : 5,
                background: isActive
                  ? 'linear-gradient(135deg, #00FFC2, #BC13FE)'
                  : 'rgba(255,255,255,0.50)',
                boxShadow: isActive
                  ? '0 0 8px rgba(0,255,194,0.6), 0 0 12px rgba(188,19,254,0.4)'
                  : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
