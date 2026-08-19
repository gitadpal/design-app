import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AtSign, CheckCircle2, Shuffle } from 'lucide-react';
import { CIRCLE_ACCENT } from './constants';
import { useMyHandle, setMyHandle, HANDLE_RE } from './meHandleStore';
import { findFriend } from './friendsStore';
import { toast } from 'sonner@2.0.3';

interface EditHandleSheetProps {
  open: boolean;
  onClose: () => void;
}

// A fresh 4-digit discriminator — the `#nnnn` tail of a handle. Lets the user
// keep a name whose base is taken by rolling a new tag in one tap.
function randomTag(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Bottom sheet for renaming your own Circle handle. Live-validates the
// `word-word#nnnn` shape and checks the new handle isn't one already held by a
// friend, then commits to the shared handle store so every surface — hub
// header, settings row, QR, share block — reflects the new name at once.
export function EditHandleSheet({ open, onClose }: EditHandleSheetProps) {
  const current = useMyHandle();
  const [value, setValue] = useState(current);

  // Re-seed the field to the live handle each time the sheet opens, so a
  // reopened sheet always starts from the current name rather than a stale draft.
  useEffect(() => {
    if (open) setValue(current);
    // Keyed on `open` only — typing shouldn't be clobbered by store updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handles are canonically lowercase; normalise as the user types so a stray
  // capital never reads as an "invalid" handle they can't see the fault in.
  const normalized = value.trim().toLowerCase();
  const wellFormed = HANDLE_RE.test(normalized);
  const unchanged = normalized === current;
  const taken = wellFormed && !unchanged && Boolean(findFriend(normalized));
  const canSave = wellFormed && !unchanged && !taken;

  const shuffleTag = () => {
    // Reroll just the discriminator, preserving the typed base name (or the
    // current one if the field's base isn't usable yet).
    const base = /^[a-z]+-[a-z]+/.exec(normalized)?.[0] ?? current.split('#')[0];
    setValue(`${base}#${randomTag()}`);
  };

  const close = () => {
    onClose();
  };

  const handleSave = () => {
    if (!canSave) return;
    setMyHandle(normalized);
    toast.success('Handle updated');
    close();
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
                  <AtSign className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 leading-none mb-1">
                    Your handle
                  </div>
                  <div className="text-base font-semibold text-foreground truncate leading-tight">
                    Edit handle
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

            {/* Current handle for reference */}
            <SectionLabel>Current</SectionLabel>
            <div className="rounded-xl bg-glass-1 border border-glass px-4 py-3 mb-5">
              <div className="font-mono text-sm font-semibold text-foreground tabular-nums">
                {current}
              </div>
            </div>

            {/* New handle editor */}
            <SectionLabel>New handle</SectionLabel>
            <div className="flex items-center gap-2">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="fern-quill#4821"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className="flex-1 min-w-0 h-12 px-4 rounded-xl bg-glass-1 border border-glass text-foreground placeholder:text-soft-4 font-mono text-sm focus:outline-none focus:border-amber-400/50"
              />
              <button
                onClick={shuffleTag}
                className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-glass-1 border border-glass text-soft-2 hover:text-foreground hover:border-amber-400/40 transition active:scale-95"
                aria-label="Shuffle tag"
                title="New random #tag"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>

            {/* Validation feedback — one line, whichever state applies. */}
            <div className="mt-1.5 min-h-[1rem]">
              {normalized.length > 0 && !wellFormed && (
                <p className="text-xs text-rose-500 dark:text-rose-400">
                  Use two lowercase words and a 4-digit tag, like fern-quill#4821.
                </p>
              )}
              {taken && (
                <p className="text-xs text-rose-500 dark:text-rose-400">
                  That handle's already taken — try shuffling the tag.
                </p>
              )}
              {unchanged && normalized.length > 0 && (
                <p className="text-xs text-soft-3">This is already your handle.</p>
              )}
              {canSave && (
                <p className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Available
                </p>
              )}
            </div>

            <p className="mt-3 text-xs text-soft-3 leading-relaxed">
              Your handle is how friends find and tip you. Renaming keeps your wallet,
              gifts, and subscriptions — only the name changes.
            </p>

            <div className="flex gap-2 mt-6">
              <button
                onClick={close}
                className="flex-1 h-12 rounded-xl text-sm font-medium border border-glass bg-glass-1 text-foreground hover:bg-glass-2 transition active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="flex-1 h-12 rounded-xl text-sm font-semibold text-[#1A1A1A] transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
                style={{ background: CIRCLE_ACCENT, boxShadow: canSave ? `0 6px 18px ${CIRCLE_ACCENT}55` : 'none' }}
              >
                Save handle
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-1 mb-2 text-[10px] uppercase tracking-[0.18em] text-amber-400/70 ${className}`}>
      {children}
    </div>
  );
}
