import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet as WalletIcon, Copy, CheckCircle2, Trash2, ArrowLeftRight } from 'lucide-react';
import { CIRCLE_ACCENT } from './constants';
import { ChainLogo } from '../web3/ChainLogo';
import { CHAINS, type ChainId } from '../CampaignGallery/chainColors';
import {
  useWallet,
  setWallet,
  removeWallet,
  shortAddress,
  EVM_ADDRESS_RE,
} from './walletStore';
import { toast } from 'sonner@2.0.3';

interface WalletSheetProps {
  open: boolean;
  onClose: () => void;
}

// Chains the receiving wallet can settle on. EVM-only — one 0x address works
// across all of them, so switching chain is just a routing choice.
const CHAIN_OPTS: ChainId[] = ['base', 'ethereum', 'arbitrum', 'optimism', 'polygon'];

// Bottom sheet for the user's receiving wallet: view the connected address,
// replace it with another (paste + chain), or disconnect it. Every action
// mutates the shared wallet store so the Circle-settings row reflects it live.
export function WalletSheet({ open, onClose }: WalletSheetProps) {
  const wallet = useWallet();
  // 'view' shows the connected card; 'edit' shows the address editor. With no
  // wallet connected the sheet opens straight into the editor to set one.
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState<ChainId>('base');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [copied, setCopied] = useState(false);

  // Re-initialise each time the sheet opens: connected → view, empty → edit.
  useEffect(() => {
    if (!open) return;
    setMode(wallet ? 'view' : 'edit');
    setAddress('');
    setChain(wallet?.chain ?? 'base');
    setConfirmRemove(false);
    setCopied(false);
    // Intentionally keyed only on `open` so re-opening resets, but live store
    // updates while open don't clobber a half-typed address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const trimmed = address.trim();
  const valid = EVM_ADDRESS_RE.test(trimmed);
  const isReplace = Boolean(wallet);

  const close = () => {
    setConfirmRemove(false);
    onClose();
  };

  const handleCopy = () => {
    if (!wallet) return;
    navigator.clipboard?.writeText(wallet.address);
    setCopied(true);
    toast.success('Address copied');
    setTimeout(() => setCopied(false), 1600);
  };

  const handleSave = () => {
    if (!valid) return;
    setWallet({ address: trimmed, chain });
    toast.success(isReplace ? 'Wallet replaced' : 'Wallet connected');
    close();
  };

  const handleRemove = () => {
    removeWallet();
    setConfirmRemove(false);
    toast('Wallet disconnected. Set one to receive gifts and payouts.', { duration: 4200 });
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
                  <WalletIcon className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 leading-none mb-1">
                    Receiving wallet
                  </div>
                  <div className="text-base font-semibold text-foreground truncate leading-tight">
                    {isReplace ? 'Wallet' : 'Connect a wallet'}
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

            {mode === 'view' && wallet ? (
              <>
                {/* Connected wallet card */}
                <SectionLabel>Connected</SectionLabel>
                <div className="rounded-xl bg-glass-1 border border-glass p-4 mb-5">
                  <div className="flex items-center gap-3 mb-3">
                    <ChainLogo chainId={wallet.chain} size={34} ringed />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground leading-tight">
                        {CHAINS[wallet.chain].label} · {shortAddress(wallet.address)}
                      </div>
                      <div className="text-[11px] flex items-center gap-1 text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 min-w-0 text-[11px] font-mono text-soft-2 break-all rounded-lg bg-soft-2 px-2.5 py-2">
                      {wallet.address}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium bg-soft-2 border border-soft-2 text-foreground hover:border-amber-400/40 transition flex-shrink-0"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setMode('edit')}
                  className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-[#1A1A1A] transition active:scale-[0.98] mb-5"
                  style={{ background: CIRCLE_ACCENT, boxShadow: `0 6px 18px ${CIRCLE_ACCENT}55` }}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Replace wallet
                </button>

                {/* Disconnect */}
                <SectionLabel>Danger zone</SectionLabel>
                <div className="rounded-xl overflow-hidden bg-rose-500/[0.06] border border-rose-500/25 p-3">
                  {!confirmRemove ? (
                    <button
                      onClick={() => setConfirmRemove(true)}
                      className="w-full h-11 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 transition active:scale-[0.98]"
                    >
                      <Trash2 className="w-4 h-4" />
                      Disconnect wallet
                    </button>
                  ) : (
                    <div>
                      <div className="text-xs text-soft-2 text-center mb-2.5 px-1">
                        Disconnect this wallet? You won't be able to receive gifts or payouts until you set a
                        new one.
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmRemove(false)}
                          className="flex-1 h-11 rounded-lg text-sm font-medium border border-glass bg-glass-1 text-foreground hover:bg-glass-2 transition active:scale-[0.98]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRemove}
                          className="flex-1 h-11 rounded-lg text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition active:scale-[0.98]"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Address editor */}
                <SectionLabel>{isReplace ? 'New address' : 'Wallet address'}</SectionLabel>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x…"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full h-12 px-4 rounded-xl bg-glass-1 border border-glass text-foreground placeholder:text-soft-4 font-mono text-sm focus:outline-none focus:border-amber-400/50"
                />
                {trimmed.length > 0 && !valid && (
                  <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400">
                    Enter a valid EVM address — 0x followed by 40 hex characters.
                  </p>
                )}

                {/* Chain picker */}
                <SectionLabel className="mt-5">Network</SectionLabel>
                <div className="grid grid-cols-5 gap-2">
                  {CHAIN_OPTS.map((c) => {
                    const active = chain === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setChain(c)}
                        className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition ${
                          active
                            ? 'border-amber-400/70 bg-amber-500/10'
                            : 'border-glass bg-glass-1 hover:bg-glass-2'
                        }`}
                      >
                        <ChainLogo chainId={c} size={24} ringed={active} />
                        <span className={`text-[10px] font-medium ${active ? 'text-foreground' : 'text-soft-2'}`}>
                          {CHAINS[c].label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-6">
                  {isReplace && (
                    <button
                      onClick={() => setMode('view')}
                      className="flex-1 h-12 rounded-xl text-sm font-medium border border-glass bg-glass-1 text-foreground hover:bg-glass-2 transition active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!valid}
                    className="flex-1 h-12 rounded-xl text-sm font-semibold text-[#1A1A1A] transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
                    style={{ background: CIRCLE_ACCENT, boxShadow: valid ? `0 6px 18px ${CIRCLE_ACCENT}55` : 'none' }}
                  >
                    {isReplace ? 'Save wallet' : 'Set wallet'}
                  </button>
                </div>
              </>
            )}
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
