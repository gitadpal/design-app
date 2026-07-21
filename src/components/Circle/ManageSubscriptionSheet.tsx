import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gem, BadgeCheck, ArrowUpCircle, ArrowDownCircle, RotateCcw } from 'lucide-react';
import { Switch } from '../ui/switch';
import { type Subscription } from '../../data/circleData';
import { CIRCLE_ACCENT, CIRCLE_ACCENT_BADGE } from './constants';
import { updateSubscription, unsubscribe, subscribeTo } from './subsStore';
import { SubscribeSheet } from './SubscribeSheet';
import { toast } from 'sonner@2.0.3';

// Default monthly price used when upgrading a free sub to paid.
const PAID_PRICE = 5;

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

interface ManageSubscriptionSheetProps {
  sub: Subscription;
  open: boolean;
  onClose: () => void;
}

// Bottom sheet for managing one subscription: switch plan (free ⇄ paid), toggle
// auto-renew, mute new-post alerts, unsubscribe, or resubscribe. Every action
// mutates the shared subs store so the change propagates instantly — and since
// the parent feeds a live `sub`, the sheet reflows between its active and
// unsubscribed states in place.
export function ManageSubscriptionSheet({ sub, open, onClose }: ManageSubscriptionSheetProps) {
  const [confirmUnsub, setConfirmUnsub] = useState(false);
  // Paid upgrades / resubscribes are charged through the SiXPay checkout sheet.
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const handle = sub.creatorHandle;
  const isPaid = sub.tier === 'paid';
  const isActive = sub.active !== false;
  const price = sub.priceUsdc ?? PAID_PRICE;

  // Free → Paid is a charge, so it runs through the checkout rather than a
  // silent store patch. The sheet stamps the paid plan + renewal on success.
  const upgrade = () => setCheckoutOpen(true);

  const downgrade = () => {
    updateSubscription(handle, { tier: 'free', autoRenew: false });
    toast(`Switched to the free plan. Paid posts pause at renewal.`, { duration: 4200 });
  };

  const toggleAutoRenew = (v: boolean) => {
    updateSubscription(handle, { autoRenew: v });
    toast(
      v
        ? 'Auto-renew on.'
        : `Auto-renew off. Access continues until ${fmtDate(sub.renewsAt)}.`,
      { duration: 4200 },
    );
  };

  const toggleAlerts = (on: boolean) => {
    updateSubscription(handle, { muted: !on });
    toast(on ? 'New-post alerts on.' : 'Muted. No new-post pings from this sub.', { duration: 3000 });
  };

  const doUnsubscribe = () => {
    // Deactivate — the sub stays in the library so received posters remain
    // usable. The sheet reflows to its "resubscribe" state via the live prop.
    unsubscribe(handle);
    setConfirmUnsub(false);
    toast(`Unsubscribed from ${sub.title}. Your received posters stay in your library.`, {
      duration: 4600,
    });
  };

  const resubscribe = () => {
    // A paid sub is charged again via checkout; a free one just reactivates.
    if (isPaid) {
      setCheckoutOpen(true);
    } else {
      subscribeTo(sub);
      toast.success(`Resubscribed to ${sub.title}.`);
    }
  };

  const close = () => {
    setConfirmUnsub(false);
    setCheckoutOpen(false);
    onClose();
  };

  return (
    <>
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
                  <Gem className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 leading-none mb-1">
                    Manage subscription
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

            {isActive ? (
              <>
                {/* Plan */}
                <SectionLabel>Plan</SectionLabel>
                <div className="rounded-xl overflow-hidden bg-glass-1 border border-white/10 mb-5">
                  <Row label="Current plan">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider"
                      style={{ background: `${CIRCLE_ACCENT}22`, color: CIRCLE_ACCENT_BADGE }}
                    >
                      <BadgeCheck className="w-3 h-3" />
                      {isPaid ? 'Paid' : 'Free'}
                    </span>
                  </Row>
                  <Row label="Price">
                    <span className="text-sm text-foreground tabular-nums">
                      {isPaid ? `${price} USDC / mo` : 'Free'}
                    </span>
                  </Row>
                  {isPaid && (
                    <>
                      <Row label={sub.autoRenew ? 'Renews' : 'Access until'}>
                        <span className="text-sm text-foreground tabular-nums">{fmtDate(sub.renewsAt)}</span>
                      </Row>
                      <ToggleRow
                        label="Auto-renew"
                        hint={sub.autoRenew ? 'Renews automatically each month.' : 'Ends after the current period.'}
                        checked={sub.autoRenew ?? true}
                        onChange={toggleAutoRenew}
                      />
                    </>
                  )}
                </div>

                {/* Switch plan CTA */}
                {isPaid ? (
                  <button
                    onClick={downgrade}
                    className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium border border-white/12 bg-glass-1 text-foreground hover:bg-glass-2 transition active:scale-[0.98] mb-5"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    Switch to Free plan
                  </button>
                ) : (
                  <button
                    onClick={upgrade}
                    className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-[#1A1A1A] transition active:scale-[0.98] mb-5"
                    style={{ background: CIRCLE_ACCENT, boxShadow: `0 6px 18px ${CIRCLE_ACCENT}55` }}
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Upgrade to Paid · {PAID_PRICE} USDC / mo
                  </button>
                )}

                {/* Notifications */}
                <SectionLabel>Notifications</SectionLabel>
                <div className="rounded-xl overflow-hidden bg-glass-1 border border-white/10 mb-5">
                  <ToggleRow
                    label="New-post alerts"
                    hint="Ping when this creator ships a new poster."
                    checked={!sub.muted}
                    onChange={toggleAlerts}
                  />
                </div>

                {/* Unsubscribe */}
                <SectionLabel>Danger zone</SectionLabel>
                <div className="rounded-xl overflow-hidden bg-rose-500/[0.06] border border-rose-500/25 p-3">
                  {!confirmUnsub ? (
                    <button
                      onClick={() => setConfirmUnsub(true)}
                      className="w-full h-11 rounded-lg text-sm font-semibold text-rose-300 hover:bg-rose-500/10 transition active:scale-[0.98]"
                    >
                      Unsubscribe
                    </button>
                  ) : (
                    <div>
                      <div className="text-xs text-soft-2 text-center mb-2.5 px-1">
                        Unsubscribe from <span className="text-foreground font-medium">{sub.title}</span>? You'll
                        stop receiving new posters{isPaid ? ' and billing ends' : ''} — but posters you've
                        already received stay in your library.
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmUnsub(false)}
                          className="flex-1 h-11 rounded-lg text-sm font-medium border border-white/12 bg-glass-1 text-foreground hover:bg-glass-2 transition active:scale-[0.98]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={doUnsubscribe}
                          className="flex-1 h-11 rounded-lg text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition active:scale-[0.98]"
                        >
                          Confirm unsubscribe
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Unsubscribed — the library keeps received posters; offer to resume. */
              <>
                <SectionLabel>Status</SectionLabel>
                <div className="rounded-xl bg-glass-1 border border-white/10 p-4 mb-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider text-soft-2 bg-white/10">
                      Unsubscribed
                    </span>
                  </div>
                  <p className="text-sm text-soft-2 leading-relaxed">
                    You're no longer subscribed to{' '}
                    <span className="text-foreground font-medium">{sub.title}</span>. The posters you already
                    received stay in your library and can still be cast — you just won't get new ones.
                  </p>
                </div>
                <button
                  onClick={resubscribe}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-[#1A1A1A] transition active:scale-[0.98]"
                  style={{ background: CIRCLE_ACCENT, boxShadow: `0 6px 18px ${CIRCLE_ACCENT}55` }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Resubscribe{isPaid ? ` · ${price} USDC / mo` : ''}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* SiXPay checkout — charges paid upgrades / resubscribes. Rendered as a
        sibling of the sheet (not inside its transformed card) so its full-screen
        overlay isn't confined to the card's box. On success the live `sub`
        reflows the manage sheet to its new paid state. */}
    <SubscribeSheet
      sub={sub}
      open={checkoutOpen}
      onClose={() => setCheckoutOpen(false)}
      intent={isActive ? 'upgrade' : 'resubscribe'}
    />
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

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 last:border-b-0">
      <div className="pr-2 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-soft-3 mt-0.5">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
