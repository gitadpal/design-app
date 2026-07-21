import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Dices, Wand2, Sparkles, RefreshCw, Check, Loader2, Wallet, ShieldCheck } from 'lucide-react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import { DROP_SERIES, getSeries, rollDrop, type Drop, type DropMode } from '../../../data/dropsData';
import { addDrop, usePlan, setPlan, TRIES_BY_PLAN, CREATION_PRICE_USDC } from './dropsStore';
import { FinishOverlay, RarityBadge } from './FinishOverlay';
import { RARITY_META } from './rarity';
import { EINK_ASPECT_RATIO, CIRCLE_TILE_ASPECT, DROPS_PRISM, DROPS_MINT, DROPS_PRISM_SOFT } from '../constants';
import { toast } from 'sonner@2.0.3';

interface CreateDropProps {
  onBack: () => void;
  onCreated: (dropId: string) => void;
}

type Step = 'mode' | 'config' | 'pay' | 'roll';

// The creation flow. Two modes with different psychologies (vision §4):
//   • Seeded Surprise — pick a style, optionally a seed; the AI rolls the subject.
//   • Artist Mode — direct it with a prompt; authorship over lottery.
// Both are VISIBLE creations (you see what you made) with a rolled rarity finish,
// and both honor bounded tries: 3 on pay-per-creation, 5 on premium, keep your
// favorite. The tries dial is the buyer's-remorse fix — you choose a character
// you love before it's minted.
export function CreateDrop({ onBack, onCreated }: CreateDropProps) {
  const plan = usePlan();
  const maxTries = TRIES_BY_PLAN[plan];

  const [step, setStep] = useState<Step>('mode');
  const [mode, setMode] = useState<DropMode>('seeded');
  const [seriesId, setSeriesId] = useState<string>(DROP_SERIES[0].id);
  const [seed, setSeed] = useState('');
  const [paid, setPaid] = useState(false);

  // Roll state — every reroll appends a visible candidate (one per try). The
  // filmstrip lets the user return to any earlier roll and keep their favorite.
  const [candidates, setCandidates] = useState<Drop[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [rolling, setRolling] = useState(false);
  const rollTimer = useRef<number | null>(null);

  useEffect(() => () => { if (rollTimer.current) window.clearTimeout(rollTimer.current); }, []);

  const doRoll = () => {
    if (rolling || candidates.length >= maxTries) return;
    setRolling(true);
    // A short "generating" beat — sells the AI roll and hides latency.
    rollTimer.current = window.setTimeout(() => {
      const c = rollDrop({ seriesId, mode, source: 'created', seed: seed.trim() || undefined, sealed: false });
      setCandidates((prev) => {
        const next = [...prev, c];
        setSelectedIdx(next.length - 1);
        return next;
      });
      setRolling(false);
    }, 850);
  };

  // Auto-roll the first candidate on entering the roll step.
  useEffect(() => {
    if (step === 'roll' && candidates.length === 0 && !rolling) doRoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const proceedFromConfig = () => {
    if (plan === 'payg' && !paid) setStep('pay');
    else setStep('roll');
  };

  const keep = () => {
    const chosen = candidates[selectedIdx];
    if (!chosen) return;
    addDrop(chosen);
    const m = RARITY_META[chosen.rarity];
    toast.success(`Minted ${chosen.name}`, { description: `${m.label} finish · ${getSeries(chosen.seriesId).title}` });
    onCreated(chosen.id);
  };

  return (
    <div className="pb-10 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-scrim border-b border-glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => (step === 'mode' ? onBack() : setStep(step === 'roll' ? 'config' : step === 'pay' ? 'config' : 'mode'))}
            className="text-foreground"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: DROPS_PRISM }}>
              <Sparkles className="w-3.5 h-3.5 text-[#08110f]" />
            </div>
            <div className="text-base font-semibold tracking-tight text-foreground">Make a Drop</div>
          </div>
        </div>
      </div>

      {/* ── Step: mode ─────────────────────────────────────────────────────── */}
      {step === 'mode' && (
        <div className="px-5 pt-5">
          <p className="text-sm text-soft-2 mb-4">Two ways to make one. You keep your favorite of a few tries.</p>
          <div className="grid gap-3">
            <ModeCard
              Icon={Dices}
              title="Seeded Surprise"
              desc="Pick a style, drop a seed, let the AI roll the character. Rarer finishes are the chase."
              onClick={() => { setMode('seeded'); setStep('config'); }}
            />
            <ModeCard
              Icon={Wand2}
              title="Artist Mode"
              desc="Direct it with a prompt and iterate. Full authorship over the lottery."
              onClick={() => { setMode('artist'); setStep('config'); }}
            />
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-glass-1 px-3 py-2.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: DROPS_MINT }} />
            <div className="text-[11px] text-soft-2">
              {plan === 'premium' ? 'Premium' : 'Pay-per-creation'} · <b className="text-foreground">{maxTries} tries</b> per drop, keep one.
            </div>
          </div>
        </div>
      )}

      {/* ── Step: config ──────────────────────────────────────────────────── */}
      {step === 'config' && (
        <div className="px-5 pt-5">
          <div className="section-header mb-2">{mode === 'artist' ? 'Base style' : 'Style / series'}</div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {DROP_SERIES.map((s) => {
              const isSel = seriesId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSeriesId(s.id)}
                  className="relative rounded-2xl overflow-hidden text-left transition active:scale-[0.98]"
                  style={{ border: `1.5px solid ${isSel ? DROPS_MINT : 'rgba(255,255,255,0.1)'}` }}
                >
                  <div className={`relative ${CIRCLE_TILE_ASPECT} w-full`}>
                    <ImageWithFallback src={s.pool[0]} alt={s.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)' }} />
                    {isSel && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: DROPS_MINT }}>
                        <Check className="w-3 h-3 text-[#08110f]" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <div className="text-[13px] font-bold text-white leading-tight">{s.title}</div>
                      <div className="text-[9px] text-white/70 leading-tight line-clamp-2 mt-0.5">{s.tagline}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="section-header mb-2">{mode === 'artist' ? 'Your prompt' : 'Seed (optional)'}</div>
          {mode === 'artist' ? (
            <textarea
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="A small fox in a paper lantern coat, big curious eyes…"
              rows={3}
              className="w-full rounded-xl bg-glass-1 border border-white/12 px-3 py-2.5 text-sm text-foreground placeholder:text-soft-4 outline-none focus:border-white/25 resize-none"
            />
          ) : (
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="a word, a mood, a name…"
              className="w-full rounded-xl bg-glass-1 border border-white/12 px-3 py-2.5 text-sm text-foreground placeholder:text-soft-4 outline-none focus:border-white/25"
            />
          )}

          <button
            onClick={proceedFromConfig}
            disabled={mode === 'artist' && seed.trim().length === 0}
            className="mt-5 w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-[#08110f] transition active:scale-[0.98] disabled:opacity-40"
            style={{ background: DROPS_PRISM, boxShadow: '0 8px 24px rgba(0,255,194,0.25)' }}
          >
            {plan === 'payg' && !paid ? `Continue · ${CREATION_PRICE_USDC} USDC` : 'Start rolling'}
          </button>
        </div>
      )}

      {/* ── Step: pay (pay-per-creation) ──────────────────────────────────── */}
      {step === 'pay' && (
        <PayStep
          onPaid={() => { setPaid(true); setStep('roll'); }}
          onPremium={() => { setPlan('premium'); toast.success('Premium unlocked', { description: '5 tries per creation' }); setStep('roll'); }}
        />
      )}

      {/* ── Step: roll ────────────────────────────────────────────────────── */}
      {step === 'roll' && (
        <div className="px-5 pt-5">
          {/* Tries meter */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxTries }).map((_, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: i < candidates.length ? DROPS_MINT : 'rgba(255,255,255,0.18)' }}
                />
              ))}
              <span className="ml-1.5 text-[11px] text-soft-3 tabular-nums">
                {Math.min(candidates.length, maxTries)} / {maxTries} tries
              </span>
            </div>
            {mode === 'artist' ? <Wand2 className="w-4 h-4 text-soft-3" /> : <Dices className="w-4 h-4 text-soft-3" />}
          </div>

          {/* Big preview of the selected candidate */}
          <div className="relative mx-auto rounded-2xl overflow-hidden" style={{ maxWidth: 280, aspectRatio: String(EINK_ASPECT_RATIO), background: '#0A0A0A', boxShadow: '0 16px 46px rgba(0,0,0,0.5)' }}>
            <AnimatePresence mode="wait">
              {rolling ? (
                <motion.div key="rolling" className="absolute inset-0 flex flex-col items-center justify-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: DROPS_PRISM_SOFT }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles className="w-8 h-8" style={{ color: DROPS_MINT }} />
                  </motion.div>
                  <div className="text-xs text-soft-2">Rolling a character…</div>
                </motion.div>
              ) : candidates[selectedIdx] ? (
                <motion.div key={candidates[selectedIdx].id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <ImageWithFallback src={candidates[selectedIdx].imageUrl} alt={candidates[selectedIdx].name} className="absolute inset-0 w-full h-full object-cover" />
                  <FinishOverlay rarity={candidates[selectedIdx].rarity} animated />
                  <div className="absolute top-3 right-3"><RarityBadge rarity={candidates[selectedIdx].rarity} serial={candidates[selectedIdx].serial} size="md" /></div>
                  <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.8))' }}>
                    <div className="text-base font-bold text-white">{candidates[selectedIdx].name}</div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Filmstrip of tries so far */}
          {candidates.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {candidates.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedIdx(i)}
                  className={`relative ${CIRCLE_TILE_ASPECT} w-11 rounded-lg overflow-hidden transition active:scale-95`}
                  style={{ border: `2px solid ${i === selectedIdx ? DROPS_MINT : 'transparent'}`, opacity: i === selectedIdx ? 1 : 0.6 }}
                >
                  <ImageWithFallback src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                  <FinishOverlay rarity={c.rarity} animated={false} />
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 grid gap-3">
            {candidates.length < maxTries ? (
              <button
                onClick={doRoll}
                disabled={rolling}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-foreground border border-white/15 bg-glass-1 transition active:scale-[0.98] disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${rolling ? 'animate-spin' : ''}`} />
                Reroll · {maxTries - candidates.length} left
              </button>
            ) : (
              plan === 'payg' && (
                <button
                  onClick={() => { setPlan('premium'); toast.success('Premium unlocked', { description: '+2 tries added' }); }}
                  className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition active:scale-[0.98]"
                  style={{ background: DROPS_PRISM_SOFT, color: DROPS_MINT, border: '1px solid rgba(0,255,194,0.3)' }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Out of tries — go Premium for 5
                </button>
              )
            )}
            <button
              onClick={keep}
              disabled={rolling || !candidates[selectedIdx]}
              className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-base font-bold text-[#08110f] transition active:scale-[0.98] disabled:opacity-40"
              style={{ background: DROPS_PRISM, boxShadow: '0 10px 30px rgba(0,255,194,0.3)' }}
            >
              <Check className="w-5 h-5" />
              Keep {candidates[selectedIdx]?.name ?? 'this one'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeCard({ Icon, title, desc, onClick }: { Icon: typeof Dices; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-start gap-3 rounded-2xl border border-white/12 bg-glass-1 p-4 text-left transition active:scale-[0.99] hover:border-white/25">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: DROPS_PRISM_SOFT }}>
        <Icon className="w-5 h-5" style={{ color: DROPS_MINT }} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-foreground">{title}</div>
        <div className="text-[12px] text-soft-3 mt-0.5 leading-snug">{desc}</div>
      </div>
    </button>
  );
}

// Compact pay-per-creation checkout — a slim mirror of the SiXPay flow used for
// subscriptions: pay in USDC, phased progress, then roll. Premium is offered as
// the alternative (skips the charge, grants more tries).
function PayStep({ onPaid, onPremium }: { onPaid: () => void; onPremium: () => void }) {
  const [paying, setPaying] = useState(false);
  const [phase, setPhase] = useState(0);
  const STEPS = ['Awaiting signature', 'Submitting payment', 'Confirmed'];

  useEffect(() => {
    if (!paying) return;
    if (phase < STEPS.length) {
      const t = setTimeout(() => setPhase((p) => p + 1), phase === 0 ? 1000 : 800);
      return () => clearTimeout(t);
    }
    const done = setTimeout(onPaid, 500);
    return () => clearTimeout(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paying, phase]);

  return (
    <div className="px-5 pt-5">
      <div className="rounded-2xl border border-white/10 bg-glass-1 p-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 mb-1">Pay-per-creation</div>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-3xl font-bold text-foreground tabular-nums">{CREATION_PRICE_USDC}</span>
          <span className="text-sm text-soft-2">USDC</span>
          <span className="text-sm text-soft-3">· {TRIES_BY_PLAN.payg} tries</span>
        </div>

        {!paying ? (
          <>
            <button
              onClick={() => setPaying(true)}
              className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#08110f] transition active:scale-[0.98]"
              style={{ background: DROPS_PRISM, boxShadow: '0 8px 22px rgba(0,255,194,0.28)' }}
            >
              <Wallet className="w-4 h-4" />
              Pay {CREATION_PRICE_USDC} USDC
            </button>
            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-soft-3">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: DROPS_MINT }} />
              Routed & settled by SiXPay on Base.
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
      </div>

      {!paying && (
        <button
          onClick={onPremium}
          className="mt-3 w-full rounded-xl px-3 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold transition active:scale-[0.99]"
          style={{ background: DROPS_PRISM_SOFT, color: DROPS_MINT, border: '1px solid rgba(0,255,194,0.3)' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Or go Premium — {TRIES_BY_PLAN.premium} tries & premium styles
        </button>
      )}
    </div>
  );
}
