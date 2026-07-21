import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Hammer, CreditCard, Nfc, ShieldCheck, Check } from 'lucide-react';
import { DROPS_PRISM, DROPS_MINT } from '../constants';
import type { Drop } from '../../../data/dropsData';
import { toast } from 'sonner@2.0.3';

interface MakeRealSheetProps {
  open: boolean;
  onClose: () => void;
  // When opened from a specific drop, the sheet names it; otherwise it's the
  // general teaser from the collection home.
  drop?: Drop | null;
}

// "Make it real" — the Phase 2 fabrication fork (DROPS_VISION §7, §9), teased in
// Phase 1. First format is a printed trading card, authenticated back to the NFT
// with an NFC tag (adpal's structural moat). Real fabrication routing is deferred,
// so this collects waitlist intent and explains the model.
export function MakeRealSheet({ open, onClose, drop }: MakeRealSheetProps) {
  const [joined, setJoined] = useState(false);

  const points = [
    { Icon: CreditCard, title: 'Printed trading card', desc: 'Flat, premium, reliable — the first fabrication format.' },
    { Icon: Nfc, title: 'NFC-authenticated', desc: 'Ships with a tag that verifies it and re-links to your NFT.' },
    { Icon: ShieldCheck, title: 'Verified factories', desc: 'Rated print partners with escrow. Fabricated only when ordered.' },
  ];

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
            className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-9"
            style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: DROPS_PRISM }}>
                  <Hammer className="w-4 h-4 text-[#08110f]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 leading-none mb-1">Fabrication · Phase 2</div>
                  <div className="text-base font-semibold text-foreground truncate leading-tight">
                    {drop ? `Make ${drop.name} real` : 'Make your drops real'}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-soft-3 hover:text-foreground transition flex-shrink-0" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-soft-2 mb-4">
              Love a drop? Route it to a factory and hold it in your hand — authenticated back to the
              original, so the physical and the digital stay the same object.
            </p>

            <div className="grid gap-2.5 mb-5">
              {points.map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 rounded-xl border border-white/10 bg-glass-1 p-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,255,194,0.12)' }}>
                    <Icon className="w-4 h-4" style={{ color: DROPS_MINT }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{title}</div>
                    <div className="text-[11px] text-soft-3">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setJoined(true);
                toast.success("You're on the fabrication waitlist", { description: "We'll ping you when printing opens." });
              }}
              disabled={joined}
              className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#08110f] transition active:scale-[0.98] disabled:opacity-70"
              style={{ background: DROPS_PRISM, boxShadow: '0 8px 22px rgba(0,255,194,0.28)' }}
            >
              {joined ? (<><Check className="w-4 h-4" /> On the waitlist</>) : 'Join the fabrication waitlist'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
