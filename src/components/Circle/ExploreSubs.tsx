import { useState } from 'react';
import { ChevronLeft, Check, Plus, Gem } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  CIRCLE_SUB_CATALOG,
  getSubCovers,
  seedTint,
  type Subscription,
} from '../../data/circleData';
import { CIRCLE_ACCENT, CIRCLE_ACCENT_BADGE, CIRCLE_TILE_ASPECT } from './constants';
import { useSubscriptions, subscribeTo } from './subsStore';
import { SubscribeSheet } from './SubscribeSheet';
import { toast } from 'sonner@2.0.3';

interface ExploreSubsProps {
  onBack: () => void;
  onOpenSubscription: (handle: string) => void;
}

// Discover screen — a catalog of creators to subscribe to. Subscribing copies
// the catalog entry into the subs store (or reactivates it) and the card flips
// to a "Subscribed" state you can tap through to the full subscription.
export function ExploreSubs({ onBack, onOpenSubscription }: ExploreSubsProps) {
  const subs = useSubscriptions();
  const isActive = (handle: string) =>
    subs.some((s) => s.creatorHandle === handle && s.active !== false);

  // Paid subscribes route through the SiXPay checkout sheet; free ones subscribe
  // instantly. `checkout` retains the entry during the sheet's exit animation.
  const [checkout, setCheckout] = useState<Subscription | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const handleSubscribe = (entry: Subscription) => {
    if (entry.tier === 'paid') {
      setCheckout(entry);
      setCheckoutOpen(true);
    } else {
      subscribeTo(entry);
      toast.success(`Subscribed to ${entry.title}`);
    }
  };

  return (
    <div className="pb-10 min-h-screen">
      <div className="sticky top-0 z-30 backdrop-blur-md bg-scrim border-b border-glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-foreground" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: CIRCLE_ACCENT }}
            >
              <Gem className="w-3.5 h-3.5 text-[#1A1A1A]" />
            </div>
            <div className="text-base font-semibold tracking-tight text-foreground">
              Discover subscriptions
            </div>
          </div>
        </div>
      </div>

      <p className="px-4 pt-4 pb-1 text-sm text-soft-2">
        Follow a creator to get their daily poster delivered to your case.
      </p>

      <div className="px-4 mt-3 space-y-3">
        {CIRCLE_SUB_CATALOG.map((entry) => (
          <CatalogCard
            key={entry.creatorHandle}
            entry={entry}
            subscribed={isActive(entry.creatorHandle)}
            onSubscribe={() => handleSubscribe(entry)}
            onOpen={() => onOpenSubscription(entry.creatorHandle)}
          />
        ))}
      </div>

      {checkout && (
        <SubscribeSheet
          sub={checkout}
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </div>
  );
}

function CatalogCard({
  entry,
  subscribed,
  onSubscribe,
  onOpen,
}: {
  entry: Subscription;
  subscribed: boolean;
  onSubscribe: () => void;
  onOpen: () => void;
}) {
  const cover = getSubCovers(entry.creatorHandle, 1)[0];
  const priceLabel =
    entry.tier === 'paid' ? `Paid · ${entry.priceUsdc ?? 5} USDC / mo` : 'Free';

  return (
    <div className="rounded-2xl border border-white/10 bg-glass-1 p-3 flex gap-3">
      {/* Cover — tappable through to the sub once subscribed */}
      <button
        onClick={subscribed ? onOpen : onSubscribe}
        className="relative flex-shrink-0 w-20 transition active:scale-[0.98]"
        aria-label={subscribed ? `Open ${entry.title}` : `Preview ${entry.title}`}
      >
        <div
          className={`relative ${CIRCLE_TILE_ASPECT} rounded-xl overflow-hidden`}
          style={{
            background: seedTint(entry.coverSeed),
            boxShadow: `0 6px 18px rgba(0,0,0,0.45), 0 0 0 1px ${CIRCLE_ACCENT}44`,
          }}
        >
          {cover && (
            <ImageWithFallback src={cover} alt={entry.title} className="w-full h-full object-cover" />
          )}
        </div>
      </button>

      {/* Info + action */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-sm font-semibold text-foreground truncate">{entry.title}</div>
        <div className="text-[11px] font-mono text-soft-3 tabular-nums truncate">
          {entry.creatorHandle}
        </div>
        {entry.tagline && (
          <p className="text-xs text-soft-2 mt-1 line-clamp-2 italic">"{entry.tagline}"</p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider flex-shrink-0"
            style={{ background: `${CIRCLE_ACCENT}1f`, color: CIRCLE_ACCENT_BADGE }}
          >
            {priceLabel}
          </span>

          {subscribed ? (
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 border border-amber-400/40 bg-amber-500/10 transition active:scale-[0.97]"
            >
              <Check className="w-3.5 h-3.5" />
              Subscribed
            </button>
          ) : (
            <button
              onClick={onSubscribe}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1A1A1A] transition active:scale-[0.97]"
              style={{ background: CIRCLE_ACCENT, boxShadow: `0 4px 12px ${CIRCLE_ACCENT}55` }}
            >
              <Plus className="w-3.5 h-3.5" />
              Subscribe
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
