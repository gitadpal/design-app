import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy } from 'lucide-react';
import { CIRCLE_ACCENT } from './constants';
import { useMyHandle } from './meHandleStore';
import { toast } from 'sonner@2.0.3';

// Bottom sheet showing the current user's handle as a scannable QR. A friend
// scans it (or copies the handle) to add you to their Circle — the mirror of
// the Add-friend "paste handle" flow.
export function HandleQrSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const handle = useMyHandle();
  const copy = () => {
    navigator.clipboard?.writeText(handle);
    toast.success('Handle copied');
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
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-3xl px-6 pt-5 pb-10"
            style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}
            initial={{ y: 140 }}
            animate={{ y: 0 }}
            exit={{ y: 140 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3">
                Your Circle QR
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-soft-3 hover:text-foreground transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR plate — amber-framed white card so it scans reliably while
                still keying to the Circle accent. */}
            <div className="flex justify-center">
              <div
                className="rounded-2xl p-4 bg-white"
                style={{
                  border: `2px solid ${CIRCLE_ACCENT}`,
                  boxShadow: `0 12px 34px ${CIRCLE_ACCENT}33`,
                }}
              >
                <QRCodeSVG
                  value={handle}
                  size={200}
                  level="M"
                  marginSize={2}
                  bgColor="#ffffff"
                  fgColor="#1A1A1A"
                />
              </div>
            </div>

            <div className="mt-5 text-center font-mono text-base font-semibold text-foreground tabular-nums">
              {handle}
            </div>
            <p className="text-center text-xs text-soft-3 mt-1">
              Have a friend scan this to add you to their Circle.
            </p>

            <button
              onClick={copy}
              className="mt-5 w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-[#1A1A1A] transition active:scale-[0.98]"
              style={{ background: CIRCLE_ACCENT, boxShadow: `0 6px 18px ${CIRCLE_ACCENT}55` }}
            >
              <Copy className="w-4 h-4" /> Copy handle
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
