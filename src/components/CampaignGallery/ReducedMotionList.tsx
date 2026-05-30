import { useEffect, useState } from 'react';
import { ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import type { GalleryCampaign } from '../../data/galleryCampaigns';
import { CHAINS } from './chainColors';

interface ReducedMotionListProps {
  campaigns: GalleryCampaign[];
  slottedId: number | null;
  onReshuffle: () => void;
  onCastCampaign: (c: GalleryCampaign) => void;
}

// Reduced-motion alternative to the panning wall. Vertical single-column list,
// tap to expand a row inline for details — no flip, no spotlight, no auto-play
// of animated frames. The user can still see the chosen-frame info but it's
// presented as a static "5 frames" stat rather than an animation. Casting goes
// straight to the campaign's first frame so we don't introduce a scrub gesture
// (also motion-y); the user can refine later from the existing detail flow.
export function ReducedMotionList({
  campaigns,
  slottedId,
  onReshuffle,
  onCastCampaign,
}: ReducedMotionListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="relative w-full h-full overflow-y-auto px-3 pt-3 pb-24">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#00FFC2' }} />
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/55 font-semibold">
              The Gallery
            </span>
          </div>
          <h1 className="text-base font-semibold text-white tracking-tight mt-0.5">
            Cards to cast
          </h1>
        </div>
        <button
          type="button"
          onClick={onReshuffle}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs text-white/80"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reshuffle</span>
        </button>
      </div>

      <ul className="space-y-2">
        {campaigns.map((c) => {
          const chain = CHAINS[c.chain];
          const slotted = c.id === slottedId;
          const expanded = expandedId === c.id;
          return (
            <li
              key={c.id}
              className="rounded-xl overflow-hidden border"
              style={{
                background: '#161616',
                borderColor: slotted ? 'rgba(0,255,194,0.55)' : 'rgba(255,255,255,0.08)',
                boxShadow: slotted ? '0 0 24px rgba(0,255,194,0.18)' : 'none',
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : c.id)}
                className="w-full flex items-center gap-3 p-2 text-left"
              >
                <div
                  className="w-14 h-20 rounded-md overflow-hidden flex-shrink-0"
                  style={{ background: '#0A0A0A' }}
                >
                  <img
                    src={c.image}
                    alt={c.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    style={{ filter: 'contrast(1.04) brightness(0.96)' }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    {slotted ? (
                      <span
                        className="text-xs font-bold tracking-wider"
                        style={{
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
                        <span className="text-base font-bold tabular-nums" style={{ color: '#00FFC2' }}>
                          {c.tokensPerCast}
                        </span>
                        <span className="text-[10px] text-white/65">◇/cast</span>
                      </>
                    )}
                    <span className="ml-auto text-[10px] text-white/55">{c.durationHours}h</span>
                  </div>
                  <div className="text-sm text-white truncate mt-0.5">{c.advertiser}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{
                        background: `${chain.color}22`,
                        color: chain.color,
                        border: `1px solid ${chain.color}55`,
                      }}
                    >
                      {chain.glyph} {chain.label}
                    </span>
                    <span className="text-[9px] text-white/55">#{c.edition}/{c.totalEdition}</span>
                    {c.frames && c.frames.length > 1 && (
                      <span className="text-[9px] text-white/55">{c.frames.length} frames</span>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/55 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
              </button>

              {expanded && (
                <div className="px-3 pt-1 pb-3 border-t border-white/[0.06] text-[12px] text-white/75 leading-relaxed space-y-2">
                  <p>{c.description}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <DetailRow label="Token" value={c.tokenSymbol} />
                    <DetailRow label="Network" value={chain.label} />
                    <DetailRow label="Duration" value={`${c.durationHours}h`} />
                    <DetailRow label="Edition" value={`#${c.edition} / ${c.totalEdition}`} />
                  </div>
                  {!slotted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCastCampaign(c);
                      }}
                      className="w-full h-11 rounded-lg font-bold text-sm mt-1.5"
                      style={{
                        background: 'linear-gradient(135deg, #00FFC2 0%, #BC13FE 100%)',
                        color: '#0A0A0A',
                      }}
                    >
                      Cast this card
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/45">{label}</span>
      <span className="text-white/90 font-semibold tabular-nums">{value}</span>
    </div>
  );
}

// Tracks `prefers-reduced-motion`. Re-renders when the user changes the OS
// setting at runtime so the gallery can swap representations without reload.
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}
