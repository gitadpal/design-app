import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ban, Plus } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { avatarForHandle, seedTint } from '../../data/circleData';
import { CIRCLE_ACCENT } from './constants';
import { isMyHandle } from './meHandleStore';
import { useBlockedHandles, blockHandle, unblockHandle, isBlocked } from './blockStore';
import { toast } from 'sonner@2.0.3';

interface BlockListSheetProps {
  open: boolean;
  onClose: () => void;
}

const HANDLE_RE = /^[a-z]+-[a-z]+#\d{4}$/;

// Bottom sheet for the block list: paste a handle to block, or unblock anyone
// already on the list. Blocked handles can't send gifts or friend requests.
// Mutates the shared block store so the Circle-settings row reflects the count
// live.
export function BlockListSheet({ open, onClose }: BlockListSheetProps) {
  const blocked = useBlockedHandles();
  const [entry, setEntry] = useState('');
  const trimmed = entry.trim().toLowerCase();
  const valid = HANDLE_RE.test(trimmed);
  const isSelf = isMyHandle(trimmed);
  const already = valid && isBlocked(trimmed);

  const close = () => {
    setEntry('');
    onClose();
  };

  const handleBlock = () => {
    if (!valid || isSelf || already) return;
    blockHandle(trimmed);
    setEntry('');
    toast.success(`Blocked ${trimmed}`);
  };

  const handleUnblock = (handle: string) => {
    unblockHandle(handle);
    toast(`Unblocked ${handle}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center"
          style={{ background: 'var(--modal-scrim)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-9 max-h-[88vh] overflow-y-auto"
            style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}
            initial={{ y: 160 }}
            animate={{ y: 0 }}
            exit={{ y: 160 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: CIRCLE_ACCENT, boxShadow: `0 6px 16px ${CIRCLE_ACCENT}44` }}
                >
                  <Ban className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 leading-none mb-1">
                    Privacy
                  </div>
                  <div className="text-base font-semibold text-foreground truncate leading-tight">
                    Block list
                  </div>
                </div>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-soft-3 hover:text-foreground transition flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-soft-2 leading-relaxed mb-4">
              Blocked people can't send you gifts or add you to their Circle. You can unblock anyone at any
              time.
            </p>

            {/* Add a handle */}
            <div className="flex gap-2">
              <input
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBlock()}
                placeholder="word-word#nnnn"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 min-w-0 h-11 px-4 rounded-xl bg-glass-1 border border-glass text-foreground placeholder:text-soft-4 font-mono text-sm focus:outline-none focus:border-amber-400/50"
              />
              <button
                onClick={handleBlock}
                disabled={!valid || isSelf || already}
                className="flex items-center gap-1.5 px-4 h-11 rounded-xl text-sm font-semibold text-[#1A1A1A] transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 flex-shrink-0"
                style={{ background: CIRCLE_ACCENT }}
              >
                <Plus className="w-4 h-4" />
                Block
              </button>
            </div>
            {entry.trim().length > 0 && (isSelf || (trimmed.length > 0 && !valid) || already) && (
              <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">
                {isSelf
                  ? "You can't block yourself."
                  : already
                    ? 'That handle is already blocked.'
                    : 'Handles look like word-word#nnnn.'}
              </p>
            )}

            {/* Blocked list */}
            <div className="mt-5">
              <div className="px-1 mb-2 text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
                Blocked ({blocked.length})
              </div>
              {blocked.length === 0 ? (
                <div className="rounded-xl bg-glass-1 border border-glass px-4 py-8 text-center">
                  <div className="text-sm text-soft-2">Nobody blocked</div>
                  <div className="text-xs text-soft-3 mt-1">
                    Handles you block will appear here.
                  </div>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden bg-glass-1 border border-glass">
                  {blocked.map((handle) => (
                    <div
                      key={handle}
                      className="flex items-center gap-3 px-3 py-2.5 border-b border-soft-3 last:border-b-0"
                    >
                      <div
                        className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-black/10 dark:ring-white/15"
                        style={{ background: seedTint(handle) }}
                      >
                        <ImageWithFallback
                          src={avatarForHandle(handle)}
                          alt={handle}
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-sm font-medium tabular-nums text-foreground truncate">
                        {handle}
                      </div>
                      <button
                        onClick={() => handleUnblock(handle)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-glass bg-glass-1 text-foreground hover:bg-glass-2 transition flex-shrink-0"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
