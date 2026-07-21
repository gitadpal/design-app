import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Gift, Hammer, Frame, Sparkles, Wand2, Dices, ShieldCheck, Check } from 'lucide-react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { useDrop } from './dropsStore';
import { FinishOverlay, RarityBadge } from './FinishOverlay';
import { GiftDropSheet } from './GiftDropSheet';
import { MakeRealSheet } from './MakeRealSheet';
import { RARITY_META } from './rarity';
import { getSeries } from '../../../data/dropsData';
import { EINK_ASPECT_RATIO, DROPS_PRISM, DROPS_MINT } from '../constants';

interface DropDetailProps {
  dropId: string;
  onBack: () => void;
  // Sealed drops route here to the develop-on-e-ink ritual.
  onReveal: () => void;
  // Revealed drops display straight on the case.
  onCastToCase: (image: { id: string; url: string; title: string }) => void;
  // Id of whatever is currently on the e-ink case, so the cast action can reflect
  // "already showing" — a sealed drop is cast as part of its reveal, so right
  // after revealing this drop is already the live display.
  currentDisplayId?: string;
  // A campaign owns the case, so cast / cast-to-reveal are disabled (the parent
  // still blocks the action; this dims the affordance to match the rule).
  castLocked?: boolean;
}

// Short, stable pseudo token id for the provenance block — provenance, not an IP
// claim (vision §10/§11): "yours to display, trade, and fabricate."
const tokenNumber = (id: string): string => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return String(Math.abs(h) % 9000 + 1000);
};

export function DropDetail({ dropId, onBack, onReveal, onCastToCase, currentDisplayId, castLocked }: DropDetailProps) {
  const drop = useDrop(dropId);
  const [giftOpen, setGiftOpen] = useState(false);
  const [makeRealOpen, setMakeRealOpen] = useState(false);
  const isOnCase = !!currentDisplayId && currentDisplayId === dropId;

  // Gifting removes the drop from the collection; guard the render against the
  // frame between send and navigation.
  if (!drop) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="text-soft-2 text-sm">This drop is no longer in your collection.</div>
      </div>
    );
  }

  const series = getSeries(drop.seriesId);

  return (
    <div className="pb-10 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-scrim border-b border-glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-foreground" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-base font-semibold tracking-tight text-foreground truncate">
            {drop.sealed ? 'Sealed drop' : drop.name}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="px-6 pt-5">
        <motion.div
          className="relative mx-auto rounded-2xl overflow-hidden"
          style={{ maxWidth: 300, aspectRatio: String(EINK_ASPECT_RATIO), boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {drop.sealed ? (
            <SealedHero imageUrl={drop.imageUrl} seriesTitle={series.title} />
          ) : (
            <>
              <ImageWithFallback src={drop.imageUrl} alt={drop.name} className="absolute inset-0 w-full h-full object-cover" />
              <FinishOverlay rarity={drop.rarity} animated />
              <div className="absolute top-3 right-3">
                <RarityBadge rarity={drop.rarity} serial={drop.serial} size="md" />
              </div>
            </>
          )}
        </motion.div>
      </div>

      {drop.sealed ? (
        // ── Sealed: reveal-by-casting is the only action ─────────────────────
        <div className="px-5 pt-6">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{series.title}</div>
            {drop.fromCreator && (
              <div className="text-[11px] font-mono text-soft-3 mt-0.5">from {drop.fromCreator}</div>
            )}
            <p className="text-sm text-soft-2 mt-3 max-w-[300px] mx-auto">
              The character and its finish are sealed. Cast it to your case — the e-ink slowly
              develops the reveal.
            </p>
          </div>

          {/* Published odds — the "provably fair" disclosure (§10) shown before reveal */}
          <div className="mt-5 rounded-xl border border-white/10 bg-glass-1 p-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 mb-2">Finish odds</div>
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

          <button
            onClick={onReveal}
            className={`mt-5 w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-base font-bold text-[#08110f] transition active:scale-[0.98] ${castLocked ? 'opacity-50' : ''}`}
            style={{ background: DROPS_PRISM, boxShadow: '0 10px 30px rgba(0,255,194,0.3)' }}
          >
            <Sparkles className="w-5 h-5" />
            Cast to reveal
          </button>
          {castLocked && (
            <p className="text-center text-[11px] text-soft-3 mt-2">
              Casting is paused while a campaign is active.
            </p>
          )}
        </div>
      ) : (
        // ── Revealed: identity + provenance + own/gift/fabricate ─────────────
        <div className="px-5 pt-6">
          {/* Identity line */}
          <div className="text-center mb-5">
            <div className="text-xl font-bold text-foreground">{drop.name}</div>
            <div className="flex items-center justify-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] text-soft-2">
                {drop.mode === 'artist' ? <Wand2 className="w-3 h-3" /> : <Dices className="w-3 h-3" />}
                {drop.mode === 'artist' ? 'Artist mode' : 'Seeded surprise'}
              </span>
              <span className="text-soft-4">·</span>
              <span className="text-[11px] text-soft-2">{series.title}</span>
            </div>
            {drop.seed && (
              <div className="text-[11px] text-soft-3 italic mt-1.5 max-w-[280px] mx-auto">"{drop.seed}"</div>
            )}
          </div>

          {/* Provenance / ownership — the "own as NFT" block */}
          <div className="rounded-xl border border-white/10 bg-glass-1 overflow-hidden mb-5">
            <Row label="Finish"><RarityBadge rarity={drop.rarity} serial={drop.serial} /></Row>
            <Row label="Collection"><span className="text-sm text-foreground">adpal · {series.title}</span></Row>
            <Row label="Token"><span className="text-sm font-mono text-foreground tabular-nums">#{tokenNumber(drop.id)}</span></Row>
            <Row label="Owner"><span className="text-sm font-mono text-foreground truncate max-w-[160px]">{drop.ownerHandle}</span></Row>
          </div>
          <div className="flex items-center gap-1.5 px-1 mb-5 text-[11px] text-soft-3">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: DROPS_MINT }} />
            Yours to display, gift, and — soon — fabricate. Provenance on-chain.
          </div>

          {/* Actions. A drop is cast to the case when it's revealed, so if it's
              the live display we say so rather than re-offer "Cast to case"; the
              button stays tappable to force a re-cast. */}
          {isOnCase ? (
            <button
              onClick={() => onCastToCase({ id: drop.id, url: drop.imageUrl, title: drop.name })}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition active:scale-[0.98]"
              style={{ color: DROPS_MINT, background: 'rgba(0,255,194,0.08)', border: `1px solid ${DROPS_MINT}66` }}
            >
              <Check className="w-4 h-4" />
              Showing on your case
            </button>
          ) : (
            <button
              onClick={() => onCastToCase({ id: drop.id, url: drop.imageUrl, title: drop.name })}
              className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-[#08110f] transition active:scale-[0.98] ${castLocked ? 'opacity-50' : ''}`}
              style={{ background: DROPS_PRISM, boxShadow: '0 8px 24px rgba(0,255,194,0.28)' }}
            >
              <Frame className="w-4 h-4" />
              Cast to case
            </button>
          )}
          {castLocked && !isOnCase && (
            <p className="text-center text-[11px] text-soft-3 mt-2">
              Casting is paused while a campaign is active.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => setGiftOpen(true)}
              className="h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-amber-300 border border-amber-400/40 bg-amber-500/10 transition active:scale-[0.98]"
            >
              <Gift className="w-4 h-4" />
              Gift to…
            </button>
            <button
              onClick={() => setMakeRealOpen(true)}
              className="h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-soft-1 border border-white/12 bg-glass-1 transition active:scale-[0.98]"
            >
              <Hammer className="w-4 h-4" />
              Make real
            </button>
          </div>
        </div>
      )}

      <GiftDropSheet drop={drop} open={giftOpen} onClose={() => setGiftOpen(false)} onSent={() => { setGiftOpen(false); onBack(); }} />
      <MakeRealSheet drop={drop} open={makeRealOpen} onClose={() => setMakeRealOpen(false)} />
    </div>
  );
}

// The sealed capsule hero — a bigger, livelier version of the tile's foil wrap.
function SealedHero({ imageUrl, seriesTitle }: { imageUrl: string; seriesTitle: string }) {
  return (
    <>
      <ImageWithFallback
        src={imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: 'blur(30px) grayscale(1) brightness(0.5)', transform: 'scale(1.4)', opacity: 0.4 }}
      />
      <div className="absolute inset-0" style={{ background: DROPS_PRISM, opacity: 0.55, mixBlendMode: 'overlay' }} />
      <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 0 2px rgba(0,255,194,0.5), inset 0 0 50px rgba(188,19,254,0.35)' }} />
      <motion.div
        aria-hidden
        className="absolute top-[-20%] bottom-[-20%] w-1/3"
        style={{ background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.65), transparent)', filter: 'blur(6px)', transform: 'skewX(-12deg)' }}
        initial={{ left: '-40%' }}
        animate={{ left: '130%' }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <motion.div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)', boxShadow: '0 0 30px rgba(0,255,194,0.5)' }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-7 h-7 text-white" />
        </motion.div>
        <div className="text-sm font-bold uppercase tracking-[0.16em] text-white/90">{seriesTitle}</div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/5 last:border-b-0">
      <div className="text-xs font-medium text-soft-3">{label}</div>
      {children}
    </div>
  );
}
