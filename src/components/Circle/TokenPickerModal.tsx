import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, X, Search } from 'lucide-react';
import { TIP_TOKENS, type TipToken } from '../../data/circleData';
import { chainIdFromLabel } from '../CampaignGallery/chainColors';
import { AssetGlyph } from '../web3/AssetGlyph';

interface TokenPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: TipToken) => void;
}

// Shape derived from sixpay's AssetSelectorModal: centered card over a scrim,
// max-w-md, rounded-2xl. Balances on the right (sixpay's balance-bearing variant).
// Skips the Select-Network step — default single-chain (Base) until multi-chain
// becomes real.
export function TokenPickerModal({ open, onClose, onSelect }: TokenPickerModalProps) {
  const [query, setQuery] = useState('');
  const filtered = TIP_TOKENS.filter(
    (t) =>
      t.symbol.toLowerCase().includes(query.toLowerCase()) ||
      t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ background: 'var(--card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <button onClick={onClose} className="text-foreground" aria-label="Back">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-sm font-semibold text-foreground">Select token</div>
              <button onClick={onClose} className="text-soft-3" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2 px-3 h-10 rounded-lg bg-black/25 border border-white/10">
                <Search className="w-4 h-4 text-soft-3" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tokens…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-soft-4 focus:outline-none"
                />
              </div>
            </div>

            {/* Rows */}
            <div className="max-h-[60vh] overflow-y-auto">
              {filtered.map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => onSelect(t)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  {/* Left group — glyph (with network badge) + token + network.
                      The corner badge + this text carry the network, so the right
                      column stays a clean balance figure. */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <AssetGlyph symbol={t.symbol} chainId={chainIdFromLabel(t.chain)} size={38} />
                    <div className="grid gap-0.5 min-w-0 text-left">
                      <span className="text-sm font-semibold text-foreground truncate">{t.symbol}</span>
                      <span className="text-[11px] text-soft-3 truncate">
                        {t.name.toLowerCase() === t.chain.toLowerCase()
                          ? t.name
                          : `${t.name} · ${t.chain}`}
                      </span>
                    </div>
                  </div>
                  {/* Right group — balance figure only */}
                  <span className="text-sm tabular-nums text-foreground flex-shrink-0">
                    {t.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center text-sm text-soft-3 py-8">
                  No tokens match "{query}"
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
