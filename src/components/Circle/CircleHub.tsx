import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../ui/card';
import { CirclePlus, QrCode, Copy, UserCog, MoreHorizontal, ChevronRight, Camera, Compass } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  getSubCovers,
  type Friend,
  type Subscription,
} from '../../data/circleData';
import { CIRCLE_ACCENT, CIRCLE_ACCENT_BADGE, CIRCLE_TILE_ASPECT } from './constants';
import { useRemarks } from './remarksStore';
import { useFriends } from './friendsStore';
import { useSubscriptions } from './subsStore';
import { useMyAvatar, setMyAvatar } from './meAvatarStore';
import { useMyHandle } from './meHandleStore';
import { warmAvatarColors } from './avatarColor';
import { HandleQrSheet } from './HandleQrSheet';
import { toast } from 'sonner@2.0.3';

// 4 columns × 3 visible rows. The More tile only appears when the friend list
// overflows that capacity; when it does, it claims the final cell so the grid
// still shows (capacity − 1) friends + More.
const FRIEND_GRID_COLS = 4;
const FRIEND_GRID_ROWS = 3;
const FRIEND_GRID_CAPACITY = FRIEND_GRID_COLS * FRIEND_GRID_ROWS;

interface CircleHubProps {
  onOpenAddFriend: () => void;
  onOpenFriend: (handle: string) => void;
  onOpenSubscription: (handle: string) => void;
  onOpenExplore: () => void;
  onOpenSettings: () => void;
  onOpenFriendList: () => void;
}

// Friend tile — portrait 5/7 with the avatar as full-bleed background and
// the caption sitting inside the bottom of the card over a gradient scrim
// (the artwork's top ~2/3 stays clean). Type is brand-approved sans (§3).
// When the user has set a remark it replaces the caption entirely; otherwise
// the tile shows the *complete* handle — prefix on top, #suffix beneath — so
// friends stay unambiguous before any remark is added.
function FriendTile({ friend, onClick }: { friend: Friend; onClick: () => void }) {
  const remarks = useRemarks();
  const remark = remarks[friend.handle];
  const [prefix, suffix] = friend.handle.split('#');
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full transition active:scale-[0.97]"
    >
      <Card className={`relative ${CIRCLE_TILE_ASPECT} w-full overflow-hidden border border-white/10 hover:border-amber-400/50 transition-colors bg-[#111]`}>
        <ImageWithFallback
          src={friend.avatarUrl}
          alt={remark ?? friend.handle}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Bottom scrim — covers the caption band so the character's face
            stays visible above. A touch taller than a single line to seat the
            two-line handle legibly. */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.85) 100%)',
          }}
        />
        {/* Caption pinned to the bottom edge, inside the card */}
        <div
          className="absolute inset-x-0 bottom-0 px-1 pb-1 text-center"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.75)' }}
        >
          {remark ? (
            <div className="font-sans font-bold text-[9px] leading-tight uppercase tracking-[0.04em] text-white truncate">
              {remark}
            </div>
          ) : (
            <>
              <div className="font-sans font-bold text-[9px] leading-tight uppercase tracking-[0.02em] text-white truncate">
                {prefix}
              </div>
              <div className="font-mono text-[8px] leading-tight text-white/75 tabular-nums truncate">
                #{suffix}
              </div>
            </>
          )}
        </div>
        {friend.hasNewGift && (
          <motion.span
            className="absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-black/40"
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
      </Card>
    </button>
  );
}

// Terminal tile — the "…and more" slot at the end of the grid. Appears only on
// overflow and opens the full friend list screen.
function MoreTile({ hiddenCount, onClick }: { hiddenCount: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full transition active:scale-[0.97]"
    >
      <Card className={`relative ${CIRCLE_TILE_ASPECT} w-full overflow-hidden border border-dashed border-white/20 hover:border-amber-400/60 bg-glass-1 transition-colors flex flex-col items-center justify-center gap-1`}>
        <MoreHorizontal className="w-4 h-4 text-soft-2" />
        <div className="font-sans font-bold text-[9px] leading-tight uppercase tracking-[0.04em] text-soft-2">
          More
        </div>
        {hiddenCount > 0 && (
          <div className="text-[9px] font-mono text-soft-3 tabular-nums">
            +{hiddenCount}
          </div>
        )}
      </Card>
    </button>
  );
}

// Subscription tile — same 5/7 portrait tile shape, wrapped in a deck of
// offset cards so it reads as a stack of unread posts. The front card shows
// the creator's latest post as a full-bleed sample cover, with the title,
// tagline, tier, and unread count overlaid on a bottom scrim — mirroring the
// FriendTile treatment so both families read as the same e-ink hardware.
function SubTile({
  sub,
  covers,
  coverIdx,
  onClick,
}: {
  sub: Subscription;
  covers: string[];
  coverIdx: number;
  onClick: () => void;
}) {
  // Controlled: the parent decides which cover shows (so only one tile cycles at
  // a time). The crossfade between covers is keyed on coverIdx below.
  const front = covers[coverIdx % Math.max(1, covers.length)];
  const behind = covers.slice(1, 3);
  // A gentle fan — small tilt + offset so the deck reads as a stack without the
  // corners bleeding past the tile into its neighbor.
  const fan = [
    { rotate: -3, x: -5, y: 5 },
    { rotate: 3, x: 5, y: 3 },
  ];
  // Unsubscribed: the received posters remain usable, so the tile stays tappable
  // — but it's greyed and labelled so it reads as a closed, archived stack.
  const inactive = sub.active === false;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative ${CIRCLE_TILE_ASPECT} w-full overflow-hidden transition active:scale-[0.97]`}
    >
      {/* Inset stage — reserves a margin around the deck so the fanned, rotated
          sheets peek out yet stay inside the tile. overflow-hidden on the button
          is the belt: nothing can reach the neighbouring stack. */}
      <div
        className="absolute inset-[10px]"
        style={inactive ? { filter: 'grayscale(1) brightness(0.72)' } : undefined}
      >
      {/* Behind sheets — genuine poster thumbnails, fanned + dimmed so the
          focused front card pops while the deck visibly holds more posters. */}
      {behind.map((url, i) => {
        const f = fan[Math.min(i, fan.length - 1)];
        return (
          <div
            key={i}
            aria-hidden="true"
            className="absolute inset-0 rounded-xl overflow-hidden border"
            style={{
              transform: `translate(${f.x}px, ${f.y}px) rotate(${f.rotate}deg)`,
              borderColor: 'rgba(245,158,11,0.42)',
              boxShadow: 'var(--deck-sheet-shadow)',
              zIndex: 0,
            }}
          >
            <ImageWithFallback
              src={url}
              alt=""
              className="w-full h-full object-cover"
              style={{ transform: 'scale(1.2)' }}
            />
            <div className="absolute inset-0" style={{ background: 'var(--deck-sheet-dim)' }} />
          </div>
        );
      })}
      {/* Front card — the current poster, zoomed in like a focused lens, with a
          drop shadow lifting it clear of the deck behind. */}
      <Card
        className="relative w-full h-full overflow-hidden border border-amber-500/50 hover:border-amber-400/80 transition-colors"
        style={{ background: 'var(--deck-front-bg)', boxShadow: 'var(--deck-front-shadow)' }}
      >
        <AnimatePresence>
          <motion.div
            key={coverIdx}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          >
            {front && (
              <ImageWithFallback
                src={front}
                alt={sub.title}
                className="absolute inset-0 w-full h-full object-cover origin-center"
                style={{ transform: 'scale(1.85)' }}
              />
            )}
          </motion.div>
        </AnimatePresence>
        {/* Bottom scrim for caption legibility over the artwork */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.9) 100%)',
          }}
        />
        {/* Unread badge — top-right amber pill (hidden once unsubscribed) */}
        {!inactive && sub.unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-[#1A1A1A] flex items-center justify-center"
            style={{ background: CIRCLE_ACCENT_BADGE, boxShadow: `0 0 8px ${CIRCLE_ACCENT_BADGE}99` }}
          >
            {sub.unreadCount}
          </span>
        )}
        {/* Caption — tier chip + title + tagline pinned to the bottom */}
        <div
          className="absolute inset-x-0 bottom-0 p-2"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}
        >
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mb-1 ${
              sub.tier === 'paid'
                ? 'text-[#1A1A1A] bg-amber-400'
                : 'text-white/90 bg-white/20'
            }`}
          >
            {sub.tier === 'paid' ? '✦ Paid' : 'Free'}
          </span>
          <div className="text-[12px] font-bold leading-tight text-white truncate">
            {sub.title}
          </div>
          {sub.tagline && (
            <div className="text-[9px] leading-tight text-white/75 line-clamp-2 mt-0.5">
              {sub.tagline.split('.')[0]}
            </div>
          )}
        </div>
      </Card>
      </div>
      {/* Unsubscribed ribbon — sits outside the greyscaled stage so it stays
          legible. The stack is still tappable to view/cast received posters. */}
      {inactive && (
        <span
          className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white bg-black/70 border border-white/25"
        >
          Unsubscribed
        </span>
      )}
    </button>
  );
}

export function CircleHub({ onOpenAddFriend, onOpenFriend, onOpenSubscription, onOpenExplore, onOpenSettings, onOpenFriendList }: CircleHubProps) {
  const friends = useFriends();
  const handle = useMyHandle();
  const [qrOpen, setQrOpen] = useState(false);

  // Current user's own avatar, tap-to-upload. A hidden file input is triggered
  // by tapping the portrait; the picked image is read as a data URL and stored
  // so it shows immediately (no backend).
  const myAvatar = useMyAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMyAvatar(reader.result);
        toast.success('Avatar updated');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Live subs — an unsubscribe removes a tile here immediately.
  const subs = useSubscriptions();
  // Subscription covers, one stack per sub; the front cover of each stack cycles
  // over time, but only ONE random stack advances per tick so the wall breathes
  // instead of all decks flipping in unison.
  const subCovers = useMemo(
    () => subs.map((s) => getSubCovers(s.creatorHandle, 4)),
    [subs]
  );
  const [coverIdxes, setCoverIdxes] = useState<number[]>(() => subs.map(() => 0));
  useEffect(() => {
    const cyclable = subCovers
      .map((c, i) => (c.length > 1 ? i : -1))
      .filter((i) => i >= 0);
    if (cyclable.length === 0) return;
    const id = setInterval(() => {
      const pick = cyclable[Math.floor(Math.random() * cyclable.length)];
      setCoverIdxes((prev) => {
        const next = prev.slice();
        next[pick] = ((next[pick] ?? 0) + 1) % subCovers[pick].length;
        return next;
      });
    }, 3400);
    return () => clearInterval(id);
  }, [subCovers]);

  // The More tile only surfaces when there are genuinely more friends than the
  // grid can hold. On overflow it claims the last cell (so we show capacity − 1
  // friends + More); otherwise every friend is shown and no More tile appears.
  const overflow = friends.length > FRIEND_GRID_CAPACITY;
  const visibleFriends = overflow
    ? friends.slice(0, FRIEND_GRID_CAPACITY - 1)
    : friends;
  const hiddenCount = friends.length - visibleFriends.length;

  // Pre-sample every friend's avatar edge color so the friend-history entry
  // reveal has its theme color ready with no first-frame flash. Re-runs when a
  // friend is added so the new portrait warms too.
  useEffect(() => {
    warmAvatarColors(friends.map((f) => f.avatarUrl));
  }, [friends]);

  return (
    <div className="pb-6">
      {/* Handle card is now the page header — no separate title row above.
          QR share and Settings live inline on the right, both minified to
          icon-only chips so the row stays quiet and the handle text is the
          hero. */}
      <div className="px-4 pt-5 pb-4">
        <div className="rounded-xl border border-amber-500/20 bg-glass-1 backdrop-blur-sm p-4">
          <div className="flex items-center gap-3">
            {/* Your avatar — tap to edit/upload. Ringed in the Circle accent to
                match the card, with a camera badge cueing that it's editable. */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="relative flex-shrink-0 transition active:scale-95"
              aria-label="Change your avatar"
            >
              <div
                className="w-14 h-14 rounded-full overflow-hidden"
                style={{ boxShadow: `0 0 0 1.5px ${CIRCLE_ACCENT}99, 0 0 10px ${CIRCLE_ACCENT}44` }}
              >
                <ImageWithFallback
                  src={myAvatar}
                  alt="Your avatar"
                  className="w-full h-full object-cover"
                  style={{ transform: 'scale(1.12)', objectPosition: 'center 28%' }}
                />
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2"
                style={{ background: CIRCLE_ACCENT, borderColor: 'var(--backdrop-base, #0b0b0d)' }}
              >
                <Camera className="w-3 h-3 text-[#1A1A1A]" />
              </span>
            </button>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 mb-1">your handle</div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="text-base font-semibold tracking-tight text-foreground tabular-nums truncate">
                    {handle}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(handle);
                      toast.success('Handle copied');
                    }}
                    className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md text-soft-3 hover:text-amber-300 hover:bg-white/5 transition"
                    aria-label="Copy handle"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setQrOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-[#1A1A1A] transition active:scale-95"
                    style={{ background: CIRCLE_ACCENT, boxShadow: `0 4px 14px ${CIRCLE_ACCENT}55` }}
                    aria-label="Share QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onOpenSettings}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/10 bg-black/20 text-soft-2 hover:text-foreground hover:border-amber-400/40 transition"
                    aria-label="Circle settings"
                  >
                    {/* Circle-specific settings glyph (user + gear) — distinct
                        from the app-wide gear in the bottom nav so this reads as
                        "your Circle settings", not the global Settings tab. */}
                    <UserCog className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />
        </div>
      </div>

      {/* Friends — small 5-col grid, 3 rows visible on entry. The last cell
          in the fold is always a More tile so the grid shape is stable
          regardless of how many friends the user has. */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          {/* Heading doubles as the always-available entry into the full friend
              list — the More tile below only appears on overflow, so this keeps
              the list reachable at any friend count. */}
          <button
            onClick={onOpenFriendList}
            className="flex items-center gap-0.5 group"
          >
            <h3 className="font-semibold tracking-tight text-foreground">
              Friends <span className="text-soft-3 font-normal">({friends.length})</span>
            </h3>
            <ChevronRight className="w-4 h-4 text-soft-3 group-hover:text-amber-300 transition-colors" />
          </button>
          <button
            onClick={onOpenAddFriend}
            className="flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            <CirclePlus className="w-4 h-4" />
            Add
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {visibleFriends.map((friend) => (
            <FriendTile
              key={friend.handle}
              friend={friend}
              onClick={() => onOpenFriend(friend.handle)}
            />
          ))}
          {overflow && (
            <MoreTile
              hiddenCount={hiddenCount}
              onClick={onOpenFriendList}
            />
          )}
        </div>
      </div>

      {/* Subscriptions — 2-col grid of stacked tiles. Each tile carries the
          same 5/7 e-ink aspect, with 2 offset cards behind for the "deck of
          unread posts" visual from the design doc. */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold tracking-tight text-foreground">
            Subscriptions <span className="text-soft-3 font-normal">({subs.length})</span>
          </h3>
          <button
            onClick={onOpenExplore}
            className="flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Compass className="w-4 h-4" />
            Explore
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 pr-2">
          {subs.map((sub, i) => (
            <SubTile
              key={sub.creatorHandle}
              sub={sub}
              covers={subCovers[i]}
              coverIdx={coverIdxes[i] ?? 0}
              onClick={() => onOpenSubscription(sub.creatorHandle)}
            />
          ))}
        </div>
      </div>

      <HandleQrSheet open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}
