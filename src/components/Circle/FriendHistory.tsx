import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Send, Check, CheckCheck, Pencil, X } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  CIRCLE_ME,
  seedTint,
  type Gift,
} from '../../data/circleData';
import { CIRCLE_ACCENT, CIRCLE_ACCENT_BADGE } from './constants';
import { useRemark, setRemark } from './remarksStore';
import { findFriend } from './friendsStore';
import { useGiftsWithFriend } from './giftsStore';
import { useAvatarColor, colorToHsl } from './avatarColor';

interface FriendHistoryProps {
  friendHandle: string;
  onBack: () => void;
  onSendGift: () => void;
  onCastImage: (previewUrl: string, title: string) => void;
  // A campaign owns the case — tapping a gift image to cast is disabled until it
  // completes (dims the tile; the actual cast is blocked upstream).
  castLocked?: boolean;
}

const timeLabel = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date('2026-07-16T13:00:00Z');
  const sameDay =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const mm = d.getUTCMinutes().toString().padStart(2, '0');
  if (sameDay) return `Today ${hh}:${mm}`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` ${hh}:${mm}`;
};

function DeliveryChip({ gift }: { gift: Gift }) {
  // Sender-side status per design ⑤ / interaction details: `Sent → Delivered
  // → Opened`. Recipient side sees no chip; the transfer is already theirs.
  if (gift.openedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/90">
        <CheckCheck className="w-3 h-3" /> Opened
      </span>
    );
  }
  if (gift.deliveredAt) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-soft-2">
        <CheckCheck className="w-3 h-3" /> Delivered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-soft-3">
      <Check className="w-3 h-3" /> Sent
    </span>
  );
}

function GiftBubble({ gift, incoming, onCast, castLocked }: { gift: Gift; incoming: boolean; onCast: () => void; castLocked?: boolean }) {
  // Two-tone bubble — amber-warm on the incoming side (a gift arriving), dark
  // glass on outgoing (a gift I sent). Both surface the image preview, token
  // line, and (if present) the note in a chat-like row. Tapping the image casts
  // it to the case.
  return (
    <div className={`flex ${incoming ? 'justify-start' : 'justify-end'} px-4`}>
      <div className="max-w-[56%] flex flex-col gap-1">
        <div
          className={`rounded-2xl overflow-hidden border ${
            incoming
              ? 'bg-amber-500/12 border-amber-500/30'
              : 'bg-black/30 border-white/10'
          }`}
          style={{
            boxShadow: incoming
              ? '0 4px 16px rgba(245,158,11,0.15)'
              : '0 4px 14px rgba(0,0,0,0.35)',
          }}
        >
          <button
            type="button"
            onClick={onCast}
            className={`relative block w-full aspect-[4/5] bg-black/30 transition active:scale-[0.98] ${castLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <ImageWithFallback
              src={gift.previewUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            {gift.tokenAmount && (
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center gap-1.5 bg-gradient-to-t from-black/85 to-transparent">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: CIRCLE_ACCENT_BADGE }}
                />
                <span className="text-[11px] font-semibold text-amber-300 tabular-nums">
                  {incoming ? '+' : '−'}
                  {gift.tokenAmount} {gift.tokenSymbol}
                </span>
              </div>
            )}
          </button>
          {gift.note && (
            <div className="px-3 py-2 text-[12px] text-foreground/90 italic leading-snug">
              "{gift.note}"
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 text-[10px] text-soft-3 ${incoming ? '' : 'justify-end'}`}>
          <span>{timeLabel(gift.sentAt)}</span>
          {!incoming && <DeliveryChip gift={gift} />}
        </div>
      </div>
    </div>
  );
}

export function FriendHistory({ friendHandle, onBack, onSendGift, onCastImage, castLocked }: FriendHistoryProps) {
  const friend = findFriend(friendHandle);
  const history = useGiftsWithFriend(friendHandle);
  const remarkOverride = useRemark(friendHandle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Theme color sampled from the friend's avatar edge — drives the entry
  // reveal, the top bar tint, and the refracted background below.
  const theme = useAvatarColor(
    friend?.avatarUrl,
    friend ? seedTint(friend.avatarSeed) : '#f59e0b'
  );

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!friend) return null;

  const prefix = friend.handle.split('#')[0];
  const suffix = friend.handle.split('#')[1];
  // Remark is the sole source of truth. When it's absent (or the user has
  // cleared it), we fall back to the original handle prefix — no baked-in
  // display name to shadow it.
  const displayName = remarkOverride ?? prefix;
  const hasRemark = !!remarkOverride;

  // Refraction palette — the avatar's theme color split into two neighboring
  // hues (±26°) so the background reads as light diffracted through a prism,
  // per the brand's "Value through Refraction" theme. The same base hue tints
  // the top bar so the whole screen feels keyed to this friend.
  const [th, tsRaw, tlRaw] = colorToHsl(theme);
  const ts = Math.min(92, Math.max(45, tsRaw));
  const tl = Math.min(60, Math.max(38, tlRaw));
  const h2 = (th + 26) % 360;
  const h3 = (th + 334) % 360;
  const diffraction =
    `radial-gradient(130% 90% at 50% -8%, hsla(${th}, ${ts}%, ${tl}%, 0.32) 0%, transparent 60%), ` +
    `radial-gradient(85% 70% at 4% 2%, hsla(${h2}, ${ts}%, ${tl}%, 0.22) 0%, transparent 55%), ` +
    `radial-gradient(85% 70% at 96% 0%, hsla(${h3}, ${ts}%, ${tl}%, 0.22) 0%, transparent 55%), ` +
    `var(--backdrop-base, #0b0b0d)`;
  const headerBg =
    `radial-gradient(140% 200% at 0% 0%, hsla(${th}, ${ts}%, ${tl}%, 0.42) 0%, hsla(${th}, ${ts}%, ${tl}%, 0.08) 40%, transparent 70%), var(--scrim-bg)`;

  const openEditor = () => {
    setDraft(remarkOverride ?? '');
    setEditing(true);
  };
  const commitEditor = () => {
    setRemark(friendHandle, draft);
    setEditing(false);
  };
  const cancelEditor = () => {
    setEditing(false);
    setDraft('');
  };

  return (
    // h-full (not 100dvh): the whole app is rendered inside a scale() transform
    // (useResponsiveScale), so 100dvh — the unscaled viewport — is taller than
    // this view's real parent and would make <main> the scroller instead of the
    // feed. h-full pins to the parent's constrained height so the feed is the
    // only scroller and the send bar stays docked.
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Refracted background — the friend's theme color diffracted across the
          top of the page, fading into the dark base. Fades in on mount as part
          of the entry reveal. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: diffraction, zIndex: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Liquid reveal — two soft, translucent blooms of the friend's theme
          color that swell out from behind the header avatar like ink diffusing
          in water, then dissolve into the refracted background. They sit above
          the feed but BELOW the header/footer chrome (z 16), so the color wells
          up from the avatar and washes down the page while the controls stay
          crisp. Expo-out easing (quick swell, slow settle) reads as organic
          rather than a hard flash. Keyed on the handle so they replay per
          friend. */}
      <motion.div
        key={`halo-${friend.handle}`}
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          top: 34,
          left: 66,
          width: 150,
          height: 150,
          marginLeft: -75,
          marginTop: -75,
          background: `radial-gradient(circle, hsla(${th}, ${ts}%, ${tl}%, 0.5) 0%, hsla(${th}, ${ts}%, ${tl}%, 0.22) 42%, transparent 70%)`,
          filter: 'blur(22px)',
          zIndex: 16,
        }}
        initial={{ scale: 0.35, opacity: 0 }}
        animate={{ scale: 12, opacity: [0, 0.85, 0] }}
        transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1], times: [0, 0.32, 1] }}
      />
      <motion.div
        key={`core-${friend.handle}`}
        aria-hidden="true"
        className="absolute rounded-full pointer-events-none"
        style={{
          top: 34,
          left: 66,
          width: 100,
          height: 100,
          marginLeft: -50,
          marginTop: -50,
          background: `radial-gradient(circle, ${theme} 0%, hsla(${th}, ${ts}%, ${tl}%, 0.45) 44%, transparent 68%)`,
          filter: 'blur(11px)',
          zIndex: 16,
        }}
        initial={{ scale: 0.22, opacity: 0 }}
        animate={{ scale: 8, opacity: [0, 1, 0] }}
        transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], times: [0, 0.26, 1] }}
      />
      {/* Header — avatar + handle. Doubles as identity anchor for a chat-like
          feed below. Tinted with the friend's theme color. */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{ background: headerBg, borderColor: `hsla(${th}, ${ts}%, 60%, 0.28)` }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-foreground" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div
            className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
            style={{
              background: seedTint(friend.avatarSeed),
              // Same chain-logo ring + zoomed portrait as the friend list, keyed
              // to this friend's theme color so identity reads consistently.
              boxShadow: `0 0 0 1.5px hsla(${th}, ${ts}%, ${tl}%, 0.6), 0 0 8px hsla(${th}, ${ts}%, ${tl}%, 0.32)`,
            }}
          >
            <ImageWithFallback
              src={friend.avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 28%', transform: 'scale(1.12)' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEditor();
                    if (e.key === 'Escape') cancelEditor();
                  }}
                  placeholder={hasRemark ? 'Edit remark' : 'Add remark'}
                  maxLength={24}
                  className="flex-1 min-w-0 h-7 px-2 rounded-md bg-black/30 border border-amber-500/50 text-sm text-foreground placeholder:text-soft-4 focus:outline-none"
                />
                <button
                  onClick={commitEditor}
                  className="h-7 px-2 rounded-md text-xs font-semibold text-[#1A1A1A] active:scale-95"
                  style={{ background: CIRCLE_ACCENT }}
                >
                  Save
                </button>
                <button
                  onClick={cancelEditor}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-soft-3 hover:text-foreground"
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {displayName}
                  </div>
                  <button
                    onClick={openEditor}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-soft-3 hover:text-amber-300 hover:bg-white/5 transition"
                    aria-label={hasRemark ? 'Edit remark' : 'Add remark'}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[11px] font-mono text-soft-3 tabular-nums truncate">
                  @{prefix}#{suffix}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feed — chat-style, newest gift last so the eye lands on the recent
          exchange when the send row appears at the bottom. Eases up under the
          reveal so the page assembles gracefully rather than snapping in. */}
      <motion.div
        className={`relative z-10 flex-1 min-h-0 overflow-y-auto py-4 ${
          history.length === 0 ? '' : 'flex flex-col-reverse gap-3'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.14 }}
      >
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center px-8 pt-[16%] text-center">
            {/* Large portrait of the friend — the empty history is really an
                invitation to start, so the person is the hero. Same ringed +
                zoomed treatment as elsewhere, keyed to their theme color. */}
            <div
              className="w-28 h-28 rounded-full overflow-hidden mb-5"
              style={{
                background: seedTint(friend.avatarSeed),
                boxShadow: `0 0 0 2px hsla(${th}, ${ts}%, ${tl}%, 0.65), 0 0 26px hsla(${th}, ${ts}%, ${tl}%, 0.4)`,
              }}
            >
              <ImageWithFallback
                src={friend.avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center 28%', transform: 'scale(1.12)' }}
              />
            </div>
            {/* First-person invite — reads as if the friend is speaking, so an
                empty history feels like a warm prompt rather than a dead end. */}
            <div className="text-lg font-semibold tracking-tight text-foreground">
              Hi, I'm {displayName}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-soft-3 tabular-nums">
              @{prefix}#{suffix}
            </div>
            <div className="mt-5 text-[15px] text-foreground/90 leading-relaxed max-w-[250px]">
              Will you be the first to send me a{' '}
              <span className="font-semibold text-amber-300">#gift</span>?
            </div>
            <button
              onClick={onSendGift}
              className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#1A1A1A] active:scale-[0.98] transition"
              style={{ background: CIRCLE_ACCENT, boxShadow: `0 8px 22px ${CIRCLE_ACCENT}55` }}
            >
              Send a gift
            </button>
          </div>
        ) : (
          // Newest-first into a column-reverse flex: the browser anchors the
          // initial scroll to the bottom (newest) with zero JS — immune to the
          // app-wide scale() transform that broke scrollTop math.
          history.map((gift) => (
            <GiftBubble
              key={gift.id}
              gift={gift}
              incoming={gift.toHandle === CIRCLE_ME.handle}
              castLocked={castLocked}
              onCast={() => onCastImage(gift.previewUrl, `Gift · ${displayName}`)}
            />
          ))
        )}
      </motion.div>

      {/* Bottom-anchored Send-gift entry. Not a full composer — that lives at
          tip-composer sub-view; this row is the discoverable jump point. Hidden
          on the empty state, where the centered invite already carries its own
          "Send a gift" CTA. */}
      {history.length > 0 && (
        <div className="sticky bottom-0 z-20 backdrop-blur-md bg-scrim border-t border-glass px-4 py-3">
          <button
            onClick={onSendGift}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-[#1A1A1A] transition active:scale-[0.98]"
            style={{ background: CIRCLE_ACCENT, boxShadow: `0 8px 22px ${CIRCLE_ACCENT}55` }}
          >
            <Send className="w-4 h-4" />
            Send gift to {displayName}
          </button>
        </div>
      )}
    </div>
  );
}
