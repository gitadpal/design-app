import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Check, Search, Send } from 'lucide-react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { useFriends } from '../friendsStore';
import { useRemarks } from '../remarksStore';
import { giftDrop } from './dropsStore';
import { RarityBadge } from './FinishOverlay';
import { CIRCLE_ACCENT, CIRCLE_TILE_ASPECT, DROPS_PRISM } from '../constants';
import type { Drop } from '../../../data/dropsData';
import { toast } from 'sonner@2.0.3';

interface GiftDropSheetProps {
  drop: Drop;
  open: boolean;
  onClose: () => void;
  // Fired after a successful send so the opener can leave the (now-empty) detail.
  onSent: () => void;
}

// Gift a drop to a Circle friend. The vision's strongest gift (§3): a personal
// creation, not a bought box. Browse or search the friend list, pick one, then a
// pinned Send button transfers it out of your collection (the mock doesn't model
// the recipient's inventory). Header / list / footer are a fixed three-row layout
// so the Send button is always visible no matter how long the friend list is.
export function GiftDropSheet({ drop, open, onClose, onSent }: GiftDropSheetProps) {
  const friends = useFriends();
  const remarks = useRemarks();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const nameOf = (handle: string) => remarks[handle] ?? handle.split('#')[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) => f.handle.toLowerCase().includes(q) || (remarks[f.handle] ?? '').toLowerCase().includes(q),
    );
  }, [friends, remarks, query]);

  const send = () => {
    if (!selected) return;
    giftDrop(drop.id);
    toast.success(`Sent ${drop.name} to ${nameOf(selected)}`, { description: 'They can cast it to their case.' });
    onSent();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center"
          style={{ background: 'var(--modal-scrim)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-3xl flex flex-col max-h-[88vh]"
            style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}
            initial={{ y: 220 }}
            animate={{ y: 0 }}
            exit={{ y: 220 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header + drop summary + search — fixed */}
            <div className="px-5 pt-5 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CIRCLE_ACCENT }}>
                    <Gift className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 leading-none mb-1">Gift to…</div>
                    <div className="text-base font-semibold text-foreground truncate leading-tight">{drop.name}</div>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-soft-3 hover:text-foreground transition flex-shrink-0" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-glass-1 border border-white/10 p-3 mb-4">
                <div className={`relative ${CIRCLE_TILE_ASPECT} w-12 flex-shrink-0 rounded-lg overflow-hidden`}>
                  <ImageWithFallback src={drop.imageUrl} alt={drop.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground truncate">{drop.name}</div>
                  <div className="mt-1"><RarityBadge rarity={drop.rarity} serial={drop.serial} /></div>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soft-3 pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search friends…"
                  className="w-full rounded-xl bg-glass-1 border border-white/12 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-soft-4 outline-none focus:border-white/25"
                />
              </div>
            </div>

            {/* Friend list — scrolls; Send stays pinned below */}
            <div className="px-5 flex-1 min-h-0 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-soft-3">No friends match “{query}”.</div>
              ) : (
                <div className="grid gap-1.5">
                  {filtered.map((f) => {
                    const isSel = selected === f.handle;
                    const [prefix, suffix] = f.handle.split('#');
                    const remark = remarks[f.handle];
                    return (
                      <button
                        key={f.handle}
                        onClick={() => setSelected(f.handle)}
                        className="w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition active:scale-[0.99]"
                        style={{
                          background: isSel ? `${CIRCLE_ACCENT}1f` : 'transparent',
                          border: `1px solid ${isSel ? CIRCLE_ACCENT : 'transparent'}`,
                        }}
                      >
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                          <ImageWithFallback src={f.avatarUrl} alt={nameOf(f.handle)} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground truncate">{remark ?? prefix}</div>
                          <div className="text-[11px] font-mono text-soft-3 tabular-nums truncate">
                            {remark ? f.handle : `#${suffix}`}
                          </div>
                        </div>
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: isSel ? CIRCLE_ACCENT : 'transparent', border: isSel ? 'none' : '1.5px solid rgba(255,255,255,0.25)' }}
                        >
                          {isSel && <Check className="w-3.5 h-3.5 text-[#1A1A1A]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Send — pinned, always visible */}
            <div className="px-5 pt-3 pb-9 shrink-0 border-t border-white/10">
              <button
                onClick={send}
                disabled={!selected}
                className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#08110f] transition active:scale-[0.98] disabled:opacity-40"
                style={{ background: DROPS_PRISM, boxShadow: '0 8px 22px rgba(0,255,194,0.25)' }}
              >
                <Send className="w-4 h-4" />
                {selected ? `Send to ${nameOf(selected)}` : 'Pick a friend'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
