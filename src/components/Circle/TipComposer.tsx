import { useState } from 'react';
import { X, ChevronRight, ImagePlus, Send, Coins } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  TIP_TOKENS,
  CIRCLE_ME,
  randomGalleryImage,
  type TipToken,
  type Gift,
} from '../../data/circleData';
import { CIRCLE_ACCENT } from './constants';
import { chainIdFromLabel } from '../CampaignGallery/chainColors';
import { AssetGlyph } from '../web3/AssetGlyph';
import { TokenPickerModal } from './TokenPickerModal';
import { useRemark } from './remarksStore';
import { addGift } from './giftsStore';
import { toast } from 'sonner@2.0.3';

interface TipComposerProps {
  friendHandle: string;
  onClose: () => void;
  onSent: () => void;
}

export function TipComposer({ friendHandle, onClose, onSent }: TipComposerProps) {
  const remark = useRemark(friendHandle);
  const displayName = remark;
  const [token, setToken] = useState<TipToken>(TIP_TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  // Crypto is opt-in — the core gift is the image. The token + amount fields
  // only appear once the sender chooses to attach crypto.
  const [attachCrypto, setAttachCrypto] = useState(false);

  const usd = amount ? (parseFloat(amount) * token.usdRate).toFixed(2) : '0.00';
  const pctFill = (pct: number) => setAmount((token.balance * pct).toFixed(token.usdRate > 100 ? 4 : 2));
  const hasAmount = !!amount && parseFloat(amount) > 0;
  const canSend = !!pickedImage && (!attachCrypto || hasAmount);

  const handleSend = () => {
    if (!canSend || !pickedImage) return;
    const withCrypto = attachCrypto && hasAmount;
    const gift: Gift = {
      id: 'g-' + Date.now(),
      fromHandle: CIRCLE_ME.handle,
      toHandle: friendHandle,
      previewUrl: pickedImage,
      tokenSymbol: withCrypto ? token.symbol : undefined,
      tokenAmount: withCrypto ? amount : undefined,
      chain: withCrypto ? CIRCLE_ME.chain : undefined,
      note: note.trim() || undefined,
      sentAt: new Date().toISOString(),
    };
    addGift(gift);
    toast.success(
      withCrypto
        ? `Sent ${amount} ${token.symbol} to ${displayName ?? friendHandle}`
        : `Sent image to ${displayName ?? friendHandle}`,
      {
        description: withCrypto
          ? 'Image is on its way — tokens have transferred.'
          : 'Image is on its way.',
      }
    );
    onSent();
  };

  const heading = displayName
    ? `Send to @${friendHandle} "${displayName}"`
    : `Send to @${friendHandle}`;

  return (
    <div className="pb-6 min-h-screen">
      <div className="sticky top-0 z-30 backdrop-blur-md bg-scrim border-b border-glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onClose} className="text-foreground" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          <div className="text-sm font-semibold tracking-tight text-foreground truncate">
            {heading}
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Image — a random gallery pick stands in for "picked from Assets".
            Container matches the e-ink screen's 2:3 portrait aspect. */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 mb-2">Image</div>
          <button
            onClick={() => {
              const shuffling = !!pickedImage;
              setPickedImage((prev) => randomGalleryImage(prev ?? undefined));
              toast.info(shuffling ? 'Shuffled — mock' : 'Picked from Assets — mock');
            }}
            className={`relative w-full max-w-[210px] mx-auto aspect-[2/3] rounded-2xl overflow-hidden border-2 transition flex flex-col items-center justify-center gap-2 ${
              pickedImage
                ? 'border-amber-400/60'
                : 'border-dashed border-white/15 bg-glass-1 text-soft-3 hover:border-amber-400/40 hover:text-amber-300'
            }`}
          >
            {pickedImage ? (
              <>
                <ImageWithFallback
                  src={pickedImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-t from-black/75 to-transparent">
                  <ImagePlus className="w-3.5 h-3.5 text-white/90" />
                  <span className="text-[11px] font-medium text-white/90">Tap to shuffle</span>
                </div>
              </>
            ) : (
              <>
                <ImagePlus className="w-6 h-6" />
                <span className="text-sm font-medium">Pick from Assets</span>
                <span className="text-[11px]">or drop file / camera</span>
              </>
            )}
          </button>
        </div>

        {/* Attach crypto — opt-in. Off by default; flipping it on reveals the
            token + amount fields below. */}
        <button
          onClick={() => setAttachCrypto((v) => !v)}
          className={`w-full px-4 py-3 rounded-xl border transition flex items-center gap-3 ${
            attachCrypto
              ? 'bg-amber-500/12 border-amber-400/50'
              : 'bg-glass-1 border-white/10 hover:border-amber-400/40'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition ${
              attachCrypto ? 'bg-amber-400/20 text-amber-300' : 'bg-black/25 text-soft-3'
            }`}
          >
            <Coins className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold text-foreground">Attach crypto</div>
            <div className="text-[11px] text-soft-3">
              {attachCrypto ? 'Tokens travel with the image' : 'Optional — send just the image'}
            </div>
          </div>
          <span
            className={`relative block w-11 h-6 rounded-full flex-shrink-0 transition-colors ${
              attachCrypto ? 'bg-amber-400' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                attachCrypto ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </span>
        </button>

        {attachCrypto && (
          <>
        {/* Token */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 mb-2">Token</div>
          <button
            onClick={() => setPickerOpen(true)}
            className="w-full h-14 px-4 rounded-xl bg-glass-1 border border-white/10 hover:border-amber-400/40 transition flex items-center gap-3"
          >
            <AssetGlyph symbol={token.symbol} chainId={chainIdFromLabel(token.chain)} size={36} />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-foreground">
                {token.symbol} · {token.chain}
              </div>
              <div className="text-[11px] text-soft-3">
                Balance {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-soft-3" />
          </button>
        </div>

        {/* Amount */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 mb-2">Amount</div>
          <div className="h-14 px-4 rounded-xl bg-glass-1 border border-white/10 flex items-center gap-3">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d.]/g, '');
                setAmount(v);
              }}
              placeholder="0.00"
              className="flex-1 bg-transparent text-lg font-semibold tabular-nums text-foreground placeholder:text-soft-4 focus:outline-none"
            />
            <span className="text-sm font-medium text-soft-2">{token.symbol}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-soft-3 tabular-nums">≈ ${usd}</span>
            <div className="flex gap-1.5">
              {[0.25, 0.5, 1].map((pct) => (
                <button
                  key={pct}
                  onClick={() => pctFill(pct)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-black/25 border border-white/10 text-soft-2 hover:text-foreground hover:border-amber-400/40 transition"
                >
                  {pct === 1 ? 'Max' : `${pct * 100}%`}
                </button>
              ))}
            </div>
          </div>
        </div>
          </>
        )}

        {/* Note */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 mb-2">
            Note (optional)
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="for your desk :)"
            maxLength={100}
            className="w-full h-12 px-4 rounded-xl bg-glass-1 border border-white/10 text-sm text-foreground placeholder:text-soft-4 focus:outline-none focus:border-amber-400/50"
          />
        </div>

        {/* Send */}
        <button
          disabled={!canSend}
          onClick={handleSend}
          className="w-full h-14 rounded-2xl text-base font-bold text-[#1A1A1A] transition active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{
            background: CIRCLE_ACCENT,
            boxShadow: canSend ? `0 10px 30px ${CIRCLE_ACCENT}55` : 'none',
          }}
        >
          <Send className="w-4 h-4" />
          {attachCrypto ? 'Send gift →' : 'Send image →'}
        </button>

        <p className="text-center text-[11px] text-soft-3 leading-relaxed">
          {attachCrypto ? (
            <>
              Tokens transfer immediately and irrevocably.<br />
              The image can be dismissed by the recipient — the tokens stay theirs either way.
            </>
          ) : (
            <>
              Just the image — no tokens attached.<br />
              The recipient can dismiss it anytime.
            </>
          )}
        </p>
      </div>

      <TokenPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(t) => {
          setToken(t);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
