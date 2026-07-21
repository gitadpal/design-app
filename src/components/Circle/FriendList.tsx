import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { seedTint, type Friend } from '../../data/circleData';
import { CIRCLE_ACCENT_BADGE } from './constants';
import { useFriends } from './friendsStore';
import { useRemarks } from './remarksStore';
import { useAvatarColor, colorToHsl, warmAvatarColors } from './avatarColor';

interface FriendListProps {
  onBack: () => void;
  onOpenFriend: (handle: string) => void;
  onOpenAddFriend: () => void;
}

// One friend row — avatar + name/handle + exchange counts, tappable to open
// that friend's gift history. Mirrors the FriendTile's identity rules: a set
// remark becomes the primary name, otherwise the handle prefix stands in and
// the full @handle sits beneath either way. The whole row is washed with the
// avatar's edge theme color, refracted into neighboring hues out from the
// portrait, and the avatar itself carries the ringed treatment used for chain
// logos so identity reads the same across the app.
function FriendRow({
  friend,
  remark,
  onClick,
}: {
  friend: Friend;
  remark: string | undefined;
  onClick: () => void;
}) {
  const [prefix, suffix] = friend.handle.split('#');
  const name = remark ?? prefix;

  // Sampled avatar edge color, split into a small prism (±26°) — the same
  // refraction language as the friend-history background, dialed way down so
  // it tints the row without hurting text legibility.
  const theme = useAvatarColor(friend.avatarUrl, seedTint(friend.avatarSeed));
  const [th, tsRaw, tlRaw] = colorToHsl(theme);
  const ts = Math.min(92, Math.max(45, tsRaw));
  const tl = Math.min(62, Math.max(40, tlRaw));
  const h2 = (th + 26) % 360;
  const h3 = (th + 334) % 360;
  const diffraction =
    `radial-gradient(62% 140% at 0% 50%, hsla(${th}, ${ts}%, ${tl}%, 0.20) 0%, transparent 66%), ` +
    `radial-gradient(46% 120% at 16% 50%, hsla(${h2}, ${ts}%, ${tl}%, 0.12) 0%, transparent 60%), ` +
    `radial-gradient(40% 110% at 30% 50%, hsla(${h3}, ${ts}%, ${tl}%, 0.07) 0%, transparent 55%)`;
  // Chain-logo ring: a crisp 1.5px theme-color rim plus a soft outer glow.
  const ring = `0 0 0 1.5px hsla(${th}, ${ts}%, ${tl}%, 0.6), 0 0 8px hsla(${th}, ${ts}%, ${tl}%, 0.32)`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full flex items-center gap-3 px-4 py-2.5 text-left transition active:scale-[0.99] overflow-hidden"
    >
      {/* Refracted theme wash emanating from the avatar edge */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: diffraction }}
      />
      {/* Hover feedback layer, above the wash */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-white/0 group-hover:bg-white/[0.04] transition-colors"
      />
      <div
        className="relative z-10 w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
        style={{ background: seedTint(friend.avatarSeed), boxShadow: ring }}
      >
        {/* Portrait zoomed in and biased toward the face so the subject fills
            the frame — reads larger, the way a chain logo bleeds its disc. */}
        <ImageWithFallback
          src={friend.avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 28%', transform: 'scale(1.12)' }}
        />
      </div>

      <div className="relative z-10 flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">{name}</div>
        <div className="text-[11px] font-mono text-soft-3 tabular-nums truncate">
          @{prefix}#{suffix}
        </div>
      </div>

      {friend.hasNewGift && (
        <motion.span
          className="relative z-10 w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: CIRCLE_ACCENT_BADGE }}
          animate={{
            scale: [1, 1.4, 1],
            boxShadow: [
              `0 0 4px ${CIRCLE_ACCENT_BADGE}`,
              `0 0 10px ${CIRCLE_ACCENT_BADGE}`,
              `0 0 4px ${CIRCLE_ACCENT_BADGE}`,
            ],
          }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          aria-label="new gift"
        />
      )}

      <ChevronRight className="relative z-10 w-4 h-4 text-soft-4 flex-shrink-0" />
    </button>
  );
}

export function FriendList({ onBack, onOpenFriend, onOpenAddFriend }: FriendListProps) {
  const friends = useFriends();
  const remarks = useRemarks();
  const [query, setQuery] = useState('');

  // Pre-sample every avatar's edge color so each row's ring + refracted wash
  // paints on first frame instead of flashing the fallback tint.
  useEffect(() => {
    warmAvatarColors(friends.map((f) => f.avatarUrl));
  }, [friends]);

  // Filter across both the remark and the raw handle so search finds a friend
  // whether the user remembers the nickname or the on-chain handle. New-gift
  // friends float to the top; otherwise store order (newest-added first) holds.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? friends.filter(
          (f) =>
            f.handle.toLowerCase().includes(q) ||
            (remarks[f.handle]?.toLowerCase().includes(q) ?? false)
        )
      : friends;
    return matched
      .map((f, i) => ({ f, i }))
      .sort((a, b) => {
        const an = a.f.hasNewGift ? 0 : 1;
        const bn = b.f.hasNewGift ? 0 : 1;
        return an - bn || a.i - b.i;
      })
      .map((x) => x.f);
  }, [friends, remarks, query]);

  return (
    <div className="pb-6 min-h-screen">
      {/* Header + search, both pinned so the list scrolls beneath them. */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-scrim border-b border-glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-foreground" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-base font-semibold tracking-tight text-foreground">
            Friends <span className="text-soft-3 font-normal">({friends.length})</span>
          </div>
          <button
            onClick={onOpenAddFriend}
            className="flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="h-10 px-3 rounded-xl bg-glass-1 border border-white/10 flex items-center gap-2 focus-within:border-amber-400/50 transition-colors">
            <Search className="w-4 h-4 text-soft-3 flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or handle"
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-soft-4 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-soft-3 hover:text-foreground flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-soft-3 py-20 px-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-glass-1 border border-white/10">
            <Search className="w-6 h-6 text-soft-3" />
          </div>
          <div className="text-sm text-foreground font-medium">No friends match</div>
          <div className="text-xs mt-1">Try a different name or handle.</div>
        </div>
      ) : (
        <div className="divide-y divide-white/5 pt-1">
          {filtered.map((friend) => (
            <FriendRow
              key={friend.handle}
              friend={friend}
              remark={remarks[friend.handle]}
              onClick={() => onOpenFriend(friend.handle)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
