import { useState } from 'react';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { Card } from '../ui/card';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  getSubPostsFor,
  seedTint,
} from '../../data/circleData';
import { CIRCLE_ACCENT, CIRCLE_ACCENT_BADGE, CIRCLE_TILE_ASPECT } from './constants';
import { useSubscription } from './subsStore';
import { ManageSubscriptionSheet } from './ManageSubscriptionSheet';

interface SubscriptionDetailProps {
  creatorHandle: string;
  onBack: () => void;
  onCastPost: (previewUrl: string, title: string) => void;
  // A campaign owns the case — tapping a poster to cast is disabled until it
  // completes (dims the grid; the actual cast is blocked upstream).
  castLocked?: boolean;
}

const dateOnly = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function SubscriptionDetail({ creatorHandle, onBack, onCastPost, castLocked }: SubscriptionDetailProps) {
  const sub = useSubscription(creatorHandle);
  const posts = getSubPostsFor(creatorHandle);
  const [manageOpen, setManageOpen] = useState(false);
  if (!sub) return null;

  // Newest poster drives the glassy hero behind the title block.
  const heroPoster = posts[0]?.previewUrl;

  return (
    <div className="pb-6 min-h-screen">
      <div className="sticky top-0 z-30 backdrop-blur-md bg-scrim border-b border-glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-base font-semibold tracking-tight text-foreground">
            {sub.title}
          </div>
        </div>
      </div>

      {/* Creator identity — a defined, artwork-forward hero: the latest poster
          shown crisp as a framed cover (the concrete focal point) floating over
          its own softly-blurred ambient glow, so the header reads as this sub's
          real artwork rather than a vague wash. */}
      <div className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0">
          {heroPoster && (
            <ImageWithFallback
              src={heroPoster}
              alt=""
              className="w-full h-full object-cover"
              style={{ transform: 'scale(1.35)', filter: 'var(--hero-img-filter)' }}
            />
          )}
          {/* Legibility scrim — light at the top so the artwork reads through,
              deepening into the page base beneath the text. Theme-aware: washes
              to white in bright mode so the dark title text stays legible. */}
          <div
            className="absolute inset-0"
            style={{ background: 'var(--hero-scrim)' }}
          />
          {/* Amber accent glow up top ties the hero to the Circle surface. */}
          <div
            className="absolute inset-x-0 top-0 h-28"
            style={{
              background: `radial-gradient(120% 100% at 50% 0%, ${CIRCLE_ACCENT}26 0%, transparent 68%)`,
            }}
          />
        </div>

        {/* Hero laid out left-to-right: the poster cover anchors the left, the
            title + description sit in the middle, and the subscription state +
            manage action stack on the right. */}
        <div className="relative z-10 px-4 pt-7 pb-6 flex gap-4">
          {/* Poster cover (left) */}
          {heroPoster ? (
            <div className="w-24 flex-shrink-0 self-start">
              <div
                className={`relative ${CIRCLE_TILE_ASPECT} rounded-2xl overflow-hidden`}
                style={{
                  boxShadow: `0 12px 32px rgba(0,0,0,0.55), 0 0 0 1.5px ${CIRCLE_ACCENT}66, 0 0 22px ${CIRCLE_ACCENT}33`,
                }}
              >
                <ImageWithFallback
                  src={heroPoster}
                  alt={sub.title}
                  className="w-full h-full object-cover"
                />
                {/* Glass sheen across the cover's top-left corner. */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.24) 0%, transparent 42%)' }}
                />
              </div>
            </div>
          ) : (
            <div
              className={`w-24 flex-shrink-0 self-start ${CIRCLE_TILE_ASPECT} rounded-2xl flex items-center justify-center`}
              style={{
                background: `linear-gradient(135deg, ${seedTint(sub.coverSeed)} 0%, ${CIRCLE_ACCENT} 100%)`,
                boxShadow: `0 8px 24px ${CIRCLE_ACCENT}33`,
              }}
            >
              <Sparkles className="w-9 h-9 text-white" />
            </div>
          )}

          {/* Right of the poster: [title + description] | [state + manage] */}
          <div className="flex-1 min-w-0 flex justify-between gap-3">
            {/* Title + description (middle) */}
            <div className="min-w-0 flex flex-col">
              <div className="text-xs tabular-nums text-soft-2 truncate">{sub.creatorHandle}</div>
              <div className="text-lg font-semibold text-foreground leading-snug mt-0.5 line-clamp-2">
                {sub.title}
              </div>
              {sub.tagline && (
                <p className="mt-2 text-sm text-soft-2 italic line-clamp-3">"{sub.tagline}"</p>
              )}
            </div>

            {/* State + manage (right) */}
            <div className="flex-shrink-0 flex flex-col items-end justify-between gap-3">
              {sub.active === false ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-soft-2 text-soft-2 uppercase tracking-wider whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-soft-3" />
                  Unsubscribed
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-200 uppercase tracking-wider whitespace-nowrap">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: CIRCLE_ACCENT_BADGE }}
                  />
                  {sub.tier === 'paid' ? 'Paid' : 'Free'}
                </div>
              )}
              <button
                onClick={() => setManageOpen(true)}
                className="px-4 py-2 rounded-xl border border-glass bg-glass-1 text-sm font-medium text-foreground hover:bg-glass-2 transition whitespace-nowrap"
              >
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Post grid */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold tracking-tight text-foreground">
            Posts <span className="text-soft-3 font-normal">({posts.length})</span>
          </h3>
          {castLocked && (
            <span className="text-[11px] text-soft-3">Casting paused — campaign active</span>
          )}
        </div>
        <div className={`grid grid-cols-2 gap-3 ${castLocked ? 'opacity-50' : ''}`}>
          {posts.map((post) => {
            return (
              <Card
                key={post.id}
                onClick={() => onCastPost(post.previewUrl, post.title ?? sub.title)}
                className={`relative overflow-hidden transition-all bg-transparent border border-soft-2 ${castLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:border-amber-400/40'}`}
              >
                <div className={`relative ${CIRCLE_TILE_ASPECT}`}>
                  <ImageWithFallback
                    src={post.previewUrl}
                    alt={post.title ?? ''}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-2">
                    <div className="text-xs text-white/90 font-medium truncate">
                      {dateOnly(post.publishedAt)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <ManageSubscriptionSheet
        sub={sub}
        open={manageOpen}
        onClose={() => setManageOpen(false)}
      />
    </div>
  );
}
