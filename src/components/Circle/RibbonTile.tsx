import { Gift, Gem } from 'lucide-react';
import { Card } from '../ui/card';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { CIRCLE_ACCENT, CIRCLE_TILE_ASPECT, CAST_MINT } from './constants';
import type { ResolvedQueueItem } from './queueHelpers';

// Corner-ribbon glyph per source — a real icon rather than an emoji so the mark
// reads crisp at small sizes and matches the app's lucide iconography: a gift
// box for a friend's Circle gift, a gem for a subscription poster.
const RIBBON_ICON = {
  gift: Gift,
  sub: Gem,
} as const;

interface RibbonTileProps {
  item: ResolvedQueueItem;
  onClick: () => void;
  isCurrentCast?: boolean;
  dimmed?: boolean;
}

// Portrait tile with an amber corner ribbon marking the item as Circle-sourced.
// Used inside the Cast tab's Featured grid and (via the same shape) inside the
// Subs gallery tab. Ribbon icon disambiguates gift / sub; attribution text
// overrides the usual tile title.
export function RibbonTile({ item, onClick, isCurrentCast, dimmed }: RibbonTileProps) {
  const RibbonGlyph = RIBBON_ICON[item.source];
  return (
    <Card
      onClick={onClick}
      className={`overflow-hidden cursor-pointer transition-all bg-transparent border ${
        dimmed ? 'opacity-50 border-soft-3' : 'border-soft-2 hover:border-white/40 hover:shadow-lg'
      }`}
    >
      <div className={`relative ${CIRCLE_TILE_ASPECT}`}>
        <ImageWithFallback
          src={item.previewUrl}
          alt=""
          className="w-full h-full object-cover"
        />

        {isCurrentCast && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: `inset 0 0 0 2px ${CAST_MINT}` }}
          />
        )}

        {/* Amber corner ribbon — one shape for every subtype; icon disambiguates. */}
        <div
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            width: 34,
            height: 34,
            background: CIRCLE_ACCENT,
            clipPath: 'polygon(0 0, 100% 0, 0 100%)',
          }}
        >
          <RibbonGlyph
            className="absolute"
            style={{ top: 3, left: 4, width: 12, height: 12, color: '#1A1A1A' }}
            strokeWidth={2.4}
          />
        </div>

        {/* Attribution strip — replaces the tile title with @handle / "This week". */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent p-2">
          <div className="text-sm text-white truncate font-medium">
            {item.attribution}
          </div>
        </div>
      </div>
    </Card>
  );
}
