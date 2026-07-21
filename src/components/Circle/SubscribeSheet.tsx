import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gem, ShieldCheck, Loader2, Check, Wallet, RefreshCw } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  TIP_TOKENS,
  getSubCovers,
  seedTint,
  type Subscription,
  type TipToken,
} from '../../data/circleData';
import { CHAINS, chainIdFromLabel } from '../CampaignGallery/chainColors';
import { AssetGlyph } from '../web3/AssetGlyph';
import { CIRCLE_ACCENT, CIRCLE_ACCENT_BADGE, CIRCLE_TILE_ASPECT } from './constants';
import { subscribeTo, updateSubscription } from './subsStore';
import { TokenPickerModal } from './TokenPickerModal';
import { toast } from 'sonner@2.0.3';

// Fallback monthly price when a paid sub carries no explicit priceUsdc.
const PAID_PRICE = 5;
// Seconds a fetched quote stays locked before it must be refreshed — mirrors
// SiXPay's quotePreviewTimeoutMs (60s default); we run a shorter window so the
// lock → expire cycle is observable in the mock.
const QUOTE_TTL = 45;

// A date one month out (mock renewal). App code, so Date is fine here.
const oneMonthOut = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
};

const fmtRenew = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, '0');

type Intent = 'subscribe' | 'upgrade' | 'resubscribe';
type QuoteState = 'loading' | 'locked' | 'expired';

interface SubscribeSheetProps {
  sub: Subscription;
  open: boolean;
  onClose: () => void;
  // Fired after a successful charge so the opener can navigate / react.
  onConfirmed?: () => void;
  // Drives the CTA verb + toast copy. All three settle the same way — a paid,
  // auto-renewing sub with a fresh renewal window — they just read differently.
  intent?: Intent;
}

// SiXPay checkout for a paid subscription. Mirrors SiXPay's payment lifecycle:
// the chosen wallet token gets a live quote (fetch → lock with countdown →
// expire), and paying runs a phased progress stepper (sign → submit → settle →
// confirmed), like sdk-ui's PaymentProgressModal + checkout-flow stages. The
// USDC-denominated monthly price is converted into whatever token the user pays
// with, settled on that token's chain. Free subs never reach this sheet.
export function SubscribeSheet({ sub, open, onClose, onConfirmed, intent = 'subscribe' }: SubscribeSheetProps) {
  const price = sub.priceUsdc ?? PAID_PRICE;
  const [token, setToken] = useState<TipToken>(TIP_TOKENS[0]);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Quote lifecycle. `quoteNonce` bumps to force a refetch (open, token change,
  // manual refresh). `secondsLeft` counts the locked quote down to expiry.
  const [quote, setQuote] = useState<QuoteState>('loading');
  const [secondsLeft, setSecondsLeft] = useState(QUOTE_TTL);
  const [quoteNonce, setQuoteNonce] = useState(0);

  // Phased payment. `paying` shows the progress modal; `phase` walks the steps.
  const [paying, setPaying] = useState(false);
  const [phase, setPhase] = useState(0);

  const cover = getSubCovers(sub.creatorHandle, 1)[0];
  const handle = sub.creatorHandle.split('#')[0];
  const renewsAt = oneMonthOut();
  // USDC-denominated price converted into the chosen token via its USD rate.
  const dueAmount = price / (token.usdRate || 1);
  const dueDisplay = dueAmount.toLocaleString(undefined, {
    maximumFractionDigits: token.usdRate > 100 ? 6 : 2,
  });
  const balanceOk = token.balance >= dueAmount;
  const chainId = chainIdFromLabel(token.chain);
  const chain = CHAINS[chainId];

  const verb = intent === 'upgrade' ? 'Upgrade' : intent === 'resubscribe' ? 'Resubscribe' : 'Subscribe';
  const verbPast = `${verb}d`; // Subscribed / Upgraded / Resubscribed

  const STEPS: { id: string; title: string; desc: string; ms: number }[] = [
    { id: 'sign', title: 'Awaiting signature', desc: 'Approve the payment in your wallet', ms: 1100 },
    { id: 'submit', title: 'Submitting payment', desc: 'Sending the signed order to SiXPay', ms: 900 },
    { id: 'settle', title: `Settling on ${chain.label}`, desc: 'Confirming the transfer on-chain', ms: 1300 },
    { id: 'confirm', title: 'Payment confirmed', desc: `Paid ${dueDisplay} ${token.symbol}`, ms: 650 },
  ];

  // Fetch a fresh quote whenever the sheet opens, the token changes, or the user
  // refreshes — resolving after a short delay to a locked quote with a countdown.
  useEffect(() => {
    if (!open || paying) return;
    setQuote('loading');
    const t = setTimeout(() => {
      setQuote('locked');
      setSecondsLeft(QUOTE_TTL);
    }, 850);
    return () => clearTimeout(t);
  }, [open, token, quoteNonce, paying]);

  // Count a locked quote down; expire it at zero.
  useEffect(() => {
    if (quote !== 'locked' || paying) return;
    if (secondsLeft <= 0) {
      setQuote('expired');
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [quote, secondsLeft, paying]);

  // Drive the phased payment once started; finalize after the last step settles.
  useEffect(() => {
    if (!paying) return;
    if (phase < STEPS.length) {
      const t = setTimeout(() => setPhase((p) => p + 1), STEPS[phase].ms);
      return () => clearTimeout(t);
    }
    // All steps complete — commit the sub and close.
    const done = setTimeout(() => {
      subscribeTo(sub);
      updateSubscription(sub.creatorHandle, {
        tier: 'paid',
        priceUsdc: price,
        renewsAt,
        autoRenew: true,
        active: true,
      });
      toast.success(`${verbPast} to ${sub.title}`, {
        description: `Paid ${dueDisplay} ${token.symbol} on ${chain.label} · renews ${fmtRenew(renewsAt)}`,
      });
      setPaying(false);
      setPhase(0);
      onConfirmed?.();
      onClose();
    }, 700);
    return () => clearTimeout(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paying, phase]);

  const refreshQuote = () => setQuoteNonce((n) => n + 1);

  const startPay = () => {
    if (quote !== 'locked' || !balanceOk || paying) return;
    setPhase(0);
    setPaying(true);
  };

  const close = () => {
    if (paying) return; // non-dismissable mid-payment
    setPickerOpen(false);
    onClose();
  };

  const quoteStatusLabel =
    quote === 'loading' ? 'Fetching quote…' : quote === 'expired' ? 'Quote expired' : `Locks in 0:${pad2(secondsLeft)}`;

  const allDone = phase >= STEPS.length;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[75] flex items-end justify-center"
            style={{ background: 'var(--modal-scrim)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-9 max-h-[90vh] overflow-y-auto"
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
                    <Gem className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 leading-none mb-1">
                      {verb} · Checkout
                    </div>
                    <div className="text-base font-semibold text-foreground truncate leading-tight">
                      {sub.title}
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

              {/* Creator summary */}
              <div className="flex items-center gap-3 rounded-xl bg-glass-1 border border-white/10 p-3 mb-5">
                <div
                  className={`relative ${CIRCLE_TILE_ASPECT} w-12 flex-shrink-0 rounded-lg overflow-hidden`}
                  style={{ background: seedTint(sub.coverSeed), boxShadow: `0 0 0 1px ${CIRCLE_ACCENT}44` }}
                >
                  {cover && (
                    <ImageWithFallback src={cover} alt={sub.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground truncate">{sub.title}</div>
                  <div className="text-[11px] font-mono text-soft-3 tabular-nums truncate">@{handle}</div>
                  {sub.tagline && (
                    <div className="text-[11px] text-soft-2 italic truncate mt-0.5">"{sub.tagline}"</div>
                  )}
                </div>
              </div>

              {/* Plan */}
              <SectionLabel>Plan</SectionLabel>
              <div className="rounded-xl overflow-hidden bg-glass-1 border border-white/10 mb-5">
                <Row label="Billing">
                  <span className="text-sm text-foreground">Monthly · auto-renew</span>
                </Row>
                <Row label="Price">
                  <span className="text-sm text-foreground tabular-nums">{price} USDC / mo</span>
                </Row>
                <Row label="Renews">
                  <span className="text-sm text-foreground tabular-nums">{fmtRenew(renewsAt)}</span>
                </Row>
              </div>

              {/* Pay with — SiXPay asset row: glyph + identity on the left, the
                  live quoted amount + lock countdown on the right. Tap to swap
                  the paying token. */}
              <SectionLabel>Pay with</SectionLabel>
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl p-3 bg-glass-1 transition active:scale-[0.99]"
                style={{ border: `1px solid ${CIRCLE_ACCENT}55` }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <AssetGlyph symbol={token.symbol} chainId={chainId} size={40} />
                  <div className="grid gap-0.5 min-w-0 text-left">
                    <span className="text-[15px] font-semibold text-foreground truncate">{token.symbol}</span>
                    <span className="text-[11px] text-soft-3 truncate">
                      Balance {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  </div>
                </div>
                <div className="grid gap-0.5 text-right flex-shrink-0" style={{ minWidth: 96 }}>
                  <span className="text-[15px] font-semibold text-foreground tabular-nums">
                    {quote === 'loading' ? '—' : `${dueDisplay} ${token.symbol}`}
                  </span>
                  <span
                    className="text-[11px] tabular-nums inline-flex items-center justify-end gap-1"
                    style={{ color: quote === 'expired' ? '#fca5a5' : quote === 'locked' ? CIRCLE_ACCENT_BADGE : undefined }}
                  >
                    {quote === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {quoteStatusLabel}
                  </span>
                </div>
              </button>

              {/* Change token + fiat/cadence line */}
              <div className="flex items-center justify-between px-1 mt-2 mb-1">
                <button
                  onClick={() => setPickerOpen(true)}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 transition"
                >
                  Change token
                </button>
                <span className="text-[11px] text-soft-3 tabular-nums">≈ ${price.toFixed(2)} · billed monthly</span>
              </div>
              {quote === 'locked' && !balanceOk && (
                <div className="px-1 text-[11px] text-rose-300">
                  Insufficient {token.symbol} balance — pick another token.
                </div>
              )}

              {/* Trust line */}
              <div className="flex items-center gap-1.5 px-1 mt-3 mb-4 text-[11px] text-soft-3">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
                Routed &amp; settled by SiXPay on {chain.label}. Cancel anytime.
              </div>

              {/* CTA */}
              {quote === 'expired' ? (
                <button
                  onClick={refreshQuote}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-foreground border border-white/15 bg-glass-1 hover:bg-glass-2 transition active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh quote
                </button>
              ) : (
                <button
                  onClick={startPay}
                  disabled={quote !== 'locked' || !balanceOk}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#1A1A1A] transition active:scale-[0.98] disabled:opacity-45"
                  style={{ background: CIRCLE_ACCENT, boxShadow: `0 8px 22px ${CIRCLE_ACCENT}55` }}
                >
                  {quote === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Fetching quote…
                    </>
                  ) : !balanceOk ? (
                    `Insufficient ${token.symbol}`
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Pay {dueDisplay} {token.symbol} · {verb}
                    </>
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token selector — rendered outside the closable overlay so its backdrop
          taps don't bubble up and dismiss the checkout sheet. */}
      <TokenPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(t) => {
          setToken(t);
          setPickerOpen(false);
        }}
      />

      {/* Phased payment progress — non-dismissable while the charge runs. */}
      <AnimatePresence>
        {paying && (
          <motion.div
            className="fixed inset-0 z-[85] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl p-6"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: allDone ? '#10b981' : CIRCLE_ACCENT }}
                >
                  {allDone ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Gem className="w-4 h-4 text-[#1A1A1A]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold text-foreground leading-tight">
                    {allDone ? 'Payment confirmed' : 'Completing payment'}
                  </div>
                  <div className="text-[11px] text-soft-3 truncate">
                    {dueDisplay} {token.symbol} · {sub.title}
                  </div>
                </div>
              </div>

              <ol className="grid gap-3.5">
                {STEPS.map((step, i) => {
                  const state = i < phase ? 'complete' : i === phase ? 'active' : 'pending';
                  return (
                    <li key={step.id} className="flex gap-3 items-start">
                      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {state === 'complete' ? (
                          <Check className="w-4 h-4" style={{ color: '#34d399' }} />
                        ) : state === 'active' ? (
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color: CIRCLE_ACCENT_BADGE }} />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-white/20" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div
                          className={`text-sm font-medium ${state === 'pending' ? 'text-soft-3' : 'text-foreground'}`}
                        >
                          {step.title}
                        </div>
                        <div className="text-[11px] text-soft-3 mt-0.5">{step.desc}</div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1 mb-2 text-[10px] uppercase tracking-[0.18em] text-amber-400/70">{children}</div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 last:border-b-0">
      <div className="text-sm font-medium text-foreground">{label}</div>
      {children}
    </div>
  );
}
