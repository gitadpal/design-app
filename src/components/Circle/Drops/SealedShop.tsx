import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Sparkles, X, Wallet, Check, Loader2, ShieldCheck, ChevronLeft } from 'lucide-react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { SEALED_OFFERS, getSeries, rollDrop, type SealedDropOffer } from '../../../data/dropsData';
import { addDrop } from './dropsStore';
import { RARITY_META } from './rarity';
import { DROPS_PRISM, DROPS_MINT, DROPS_PRISM_SOFT } from '../constants';
import { toast } from 'sonner@2.0.3';

interface SealedShopProps {
  onBack: () => void;
  // Fired after a purchase so the opener can return to the collection where the
  // new sealed capsule now waits.
  onPurchased?: () => void;
}

// The sealed blind-box shop — the "sealed, independent" sale mode from the vision
// (creators sell them; you don't make them). Buying rolls a hidden Drop into the
// collection, sealed; you reveal it by casting. Reached as an entry under the
// Cast page's Drops tab.
export function SealedShop({ onBack, onPurchased }: SealedShopProps) {
  const [buying, setBuying] = useState<SealedDropOffer | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);

  return (
    <div className="pb-10 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-scrim border-b border-glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-foreground" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: DROPS_PRISM }}>
              <Box className="w-3.5 h-3.5 text-[#08110f]" />
            </div>
            <div className="text-base font-semibold tracking-tight text-foreground">Sealed boxes</div>
          </div>
        </div>
      </div>

      <p className="px-4 pt-4 text-[12px] text-soft-3 mb-3">
        Blind boxes from creators. Buy sealed, then cast to your case to reveal — finish odds published.
      </p>

      <div className="px-4 grid gap-3">
        {SEALED_OFFERS.map((offer) => (
          <div key={offer.id} className="rounded-2xl border border-white/10 bg-glass-1 p-3 flex gap-3">
            {/* Foil-wrapped key art */}
            <div className="relative flex-shrink-0 w-20 aspect-[5/7] rounded-xl overflow-hidden" style={{ boxShadow: `0 6px 18px rgba(0,0,0,0.45)` }}>
              <ImageWithFallback src={offer.keyArt} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(14px) grayscale(1) brightness(0.5)', transform: 'scale(1.3)', opacity: 0.45 }} />
              <div className="absolute inset-0" style={{ background: DROPS_PRISM, opacity: 0.5, mixBlendMode: 'overlay' }} />
              <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 0 1.5px rgba(0,255,194,0.5)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white/90" />
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="text-sm font-semibold text-foreground truncate">{offer.title}</div>
              <div className="text-[11px] font-mono text-soft-3 truncate">{offer.creatorHandle}</div>
              <p className="text-[11px] text-soft-2 mt-1 line-clamp-2">{offer.blurb}</p>
              <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider flex-shrink-0" style={{ background: DROPS_PRISM_SOFT, color: DROPS_MINT }}>
                  1 / {offer.edition}
                </span>
                <button
                  onClick={() => { setBuying(offer); setBuyOpen(true); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#08110f] transition active:scale-[0.97]"
                  style={{ background: DROPS_PRISM, boxShadow: '0 4px 12px rgba(0,255,194,0.3)' }}
                >
                  <Box className="w-3.5 h-3.5" />
                  {offer.priceUsdc} USDC
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {buying && (
        <BuySealedSheet
          offer={buying}
          open={buyOpen}
          onClose={() => setBuyOpen(false)}
          onPurchased={onPurchased}
        />
      )}
    </div>
  );
}

// Compact SiXPay checkout for a blind box. On confirmation it rolls the hidden
// drop and drops it into the collection sealed.
function BuySealedSheet({ offer, open, onClose, onPurchased }: { offer: SealedDropOffer; open: boolean; onClose: () => void; onPurchased?: () => void }) {
  const [paying, setPaying] = useState(false);
  const [phase, setPhase] = useState(0);
  const STEPS = ['Awaiting signature', 'Sealing your box', 'Confirmed'];

  useEffect(() => {
    if (!open) { setPaying(false); setPhase(0); }
  }, [open]);

  useEffect(() => {
    if (!paying) return;
    if (phase < STEPS.length) {
      const t = setTimeout(() => setPhase((p) => p + 1), phase === 0 ? 1000 : 850);
      return () => clearTimeout(t);
    }
    const done = setTimeout(() => {
      const drop = rollDrop({ seriesId: offer.seriesId, mode: 'seeded', source: 'sealed', sealed: true, fromCreator: offer.creatorHandle });
      addDrop(drop);
      toast.success('Sealed drop added', { description: 'Cast it to your case to reveal what’s inside.' });
      onClose();
      onPurchased?.();
    }, 550);
    return () => clearTimeout(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paying, phase]);

  const series = getSeries(offer.seriesId);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center"
          style={{ background: 'var(--modal-scrim)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => { if (!paying) onClose(); }}
        >
          <motion.div
            className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-9"
            style={{ background: 'var(--card)', borderTop: '1px solid var(--border)' }}
            initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: DROPS_PRISM }}>
                  <Box className="w-4 h-4 text-[#08110f]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 leading-none mb-1">Sealed box · Checkout</div>
                  <div className="text-base font-semibold text-foreground truncate leading-tight">{offer.title}</div>
                </div>
              </div>
              <button onClick={() => { if (!paying) onClose(); }} disabled={paying} className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-soft-3 hover:text-foreground transition disabled:opacity-30" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Odds disclosure */}
            <div className="rounded-xl border border-white/10 bg-glass-1 p-3 mb-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 mb-2">Finish odds · {series.title}</div>
              <div className="grid grid-cols-5 gap-1.5">
                {(['common', 'rare', 'holo', 'gold', 'secret'] as const).map((r) => (
                  <div key={r} className="text-center">
                    <div className="h-1.5 rounded-full mb-1" style={{ background: RARITY_META[r].accent }} />
                    <div className="text-[9px] font-bold text-foreground">{RARITY_META[r].label}</div>
                    <div className="text-[9px] text-soft-3 tabular-nums">{RARITY_META[r].chance}</div>
                  </div>
                ))}
              </div>
            </div>

            {!paying ? (
              <>
                <button
                  onClick={() => setPaying(true)}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#08110f] transition active:scale-[0.98]"
                  style={{ background: DROPS_PRISM, boxShadow: '0 8px 22px rgba(0,255,194,0.28)' }}
                >
                  <Wallet className="w-4 h-4" />
                  Pay {offer.priceUsdc} USDC · Buy sealed
                </button>
                <div className="flex items-center gap-1.5 mt-3 text-[11px] text-soft-3">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: DROPS_MINT }} />
                  Provably-fair odds · settled by SiXPay on Base.
                </div>
              </>
            ) : (
              <ol className="grid gap-3 py-1">
                {STEPS.map((label, i) => {
                  const state = i < phase ? 'done' : i === phase ? 'active' : 'pending';
                  return (
                    <li key={label} className="flex items-center gap-3">
                      <span className="w-5 h-5 flex items-center justify-center">
                        {state === 'done' ? <Check className="w-4 h-4" style={{ color: DROPS_MINT }} />
                          : state === 'active' ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: DROPS_MINT }} />
                          : <span className="w-2 h-2 rounded-full bg-white/20" />}
                      </span>
                      <span className={`text-sm ${state === 'pending' ? 'text-soft-3' : 'text-foreground'}`}>{label}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
