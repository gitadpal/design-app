import { useCallback, useState } from 'react';
import { ChevronLeft, QrCode, Copy, Share2, CheckCircle2 } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { CIRCLE_ME, seedTint, avatarForHandle, type Friend } from '../../data/circleData';
import { CIRCLE_ACCENT } from './constants';
import { useAvatarColor, colorToHsl } from './avatarColor';
import { addFriend } from './friendsStore';
import { setRemark as setFriendRemark } from './remarksStore';
import { HandleQrSheet } from './HandleQrSheet';
import { QrScanner } from './QrScanner';
import { toast } from 'sonner@2.0.3';

interface AddFriendProps {
  onBack: () => void;
  onAdded: (handle: string) => void;
}

type Mode = 'scan' | 'paste';

const HANDLE_RE = /^[a-z]+-[a-z]+#\d{4}$/;

// Plausible-looking wallet address derived from the handle (mock — no backend).
const mockAddress = (h: string): string => {
  let hex = '';
  for (let i = 0; i < h.length; i++) hex += h.charCodeAt(i).toString(16);
  return '0x' + (hex + '0'.repeat(40)).slice(0, 40);
};

export function AddFriend({ onBack, onAdded }: AddFriendProps) {
  const [mode, setMode] = useState<Mode>('scan');
  const [pasted, setPasted] = useState('');
  const [remark, setRemark] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const trimmed = pasted.trim().toLowerCase();
  const valid = HANDLE_RE.test(trimmed);

  // Preview the target's portrait + a theme color sampled from its edge, used
  // to tint the add card. avatarForHandle is deterministic, so the preview
  // matches the avatar the friend will actually be given.
  const avatarUrl = valid ? avatarForHandle(trimmed) : undefined;
  const themeColor = useAvatarColor(avatarUrl, seedTint(trimmed || 'preview'));
  const [ch, csRaw, clRaw] = colorToHsl(themeColor);
  const cs = Math.min(90, Math.max(45, csRaw));
  const cl = Math.min(62, Math.max(38, clRaw));
  const cardBg = `linear-gradient(135deg, hsla(${ch}, ${cs}%, ${cl}%, 0.24) 0%, hsla(${ch}, ${cs}%, ${cl}%, 0.06) 70%), var(--tint-card-base)`;
  const cardBorder = `hsla(${ch}, ${cs}%, 62%, 0.45)`;

  // A scanned QR carries a Circle handle — either bare (word-word#nnnn) or as an
  // invite link (invite.circle/word-word#nnnn). Pull the handle out, and if it's
  // one of ours, drop into the paste flow so the user reviews before adding.
  // Returns whether the payload was accepted, so the scanner can keep looking
  // when a non-Circle QR wanders into frame.
  const handleScanDetect = useCallback((value: string): boolean => {
    const candidate = value.split('/').pop()?.trim().toLowerCase() ?? '';
    if (!HANDLE_RE.test(candidate)) return false;
    setPasted(candidate);
    setRemark('');
    setMode('paste');
    toast.success(`Scanned ${candidate} — review & add`);
    return true;
  }, []);

  const handleCopy = () => {
    navigator.clipboard?.writeText(CIRCLE_ME.handle);
    toast.success('Handle copied');
  };

  const handleShareLink = () => {
    toast.info(`invite.circle/${CIRCLE_ME.handle}`);
  };

  const handleAdd = () => {
    if (!valid) return;
    const newFriend: Friend = {
      handle: trimmed,
      avatarSeed: trimmed.split('-')[0] || trimmed,
      avatarUrl: avatarForHandle(trimmed),
      walletAddress: mockAddress(trimmed),
      addedAt: new Date().toISOString(),
      sentCount: 0,
      receivedCount: 0,
    };
    addFriend(newFriend);
    const r = remark.trim();
    if (r) setFriendRemark(trimmed, r);
    toast.success(`Added ${trimmed} to your Circle`);
    onAdded(trimmed);
  };

  return (
    <div className="pb-6 min-h-screen">
      <div className="sticky top-0 z-30 backdrop-blur-md bg-scrim border-b border-glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-base font-semibold tracking-tight text-foreground">
            Add friend
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="px-4 pt-5">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-glass-1 border border-white/10">
          {(['scan', 'paste'] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`h-9 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-amber-500 text-[#1A1A1A] shadow'
                    : 'text-soft-2 hover:text-foreground'
                }`}
              >
                {m === 'scan' ? 'Scan QR' : 'Paste handle'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      {mode === 'scan' ? (
        <div className="px-4 pt-5">
          <QrScanner active={mode === 'scan'} onDetect={handleScanDetect} />
          <p className="text-center text-sm text-soft-3 mt-4">
            Point at a friend's Circle QR
          </p>
        </div>
      ) : (
        <div className="px-4 pt-5">
          <label className="text-[10px] uppercase tracking-[0.18em] text-soft-3">
            Handle
          </label>
          <input
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="word-word#nnnn"
            autoComplete="off"
            spellCheck={false}
            className="mt-1.5 w-full h-12 px-4 rounded-xl bg-glass-1 border border-white/10 text-foreground placeholder:text-soft-4 font-mono text-sm focus:outline-none focus:border-amber-400/50"
          />
          <p className="mt-2 text-xs text-soft-3 leading-relaxed">
            Handles look like <span className="font-mono text-soft-2">word-word#nnnn</span>. Ask your friend for theirs — they can copy it from Circle → Share QR.
          </p>

          {valid && (
            <div
              className="mt-5 rounded-2xl border p-4 flex flex-col gap-3 backdrop-blur-sm"
              style={{ background: cardBg, borderColor: cardBorder }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-black/10 dark:ring-white/15"
                  style={{ background: seedTint(trimmed) }}
                >
                  <ImageWithFallback
                    src={avatarUrl}
                    alt={trimmed}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold tabular-nums text-foreground truncate">{trimmed}</div>
                  <div className="text-[11px] flex items-center gap-1 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Wallet verified
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.18em] text-soft-3">Remark</label>
                <input
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Add a nickname (optional)"
                  className="mt-1.5 w-full h-10 px-3 rounded-lg bg-soft-2 border border-soft-2 text-sm text-foreground placeholder:text-soft-4 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <button
                onClick={handleAdd}
                className="w-full h-11 rounded-xl text-sm font-semibold text-[#1A1A1A] transition active:scale-95"
                style={{ background: CIRCLE_ACCENT, boxShadow: `0 6px 18px ${CIRCLE_ACCENT}55` }}
              >
                Add to Circle →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Own handle share block */}
      <div className="mx-4 my-6 border-t border-white/10" />
      <div className="px-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-soft-3 mb-2">
          Or share yours
        </div>
        <div className="rounded-2xl border border-white/10 bg-glass-1 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-sm text-foreground tabular-nums">
              {CIRCLE_ME.handle}
            </div>
            <button
              onClick={() => setQrOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/25 border border-white/10 text-foreground hover:bg-black/40"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="h-9 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium bg-black/25 border border-white/10 text-foreground hover:bg-black/40 transition"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button
              onClick={handleShareLink}
              className="h-9 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium bg-black/25 border border-white/10 text-foreground hover:bg-black/40 transition"
            >
              <Share2 className="w-3.5 h-3.5" /> Share link
            </button>
          </div>
        </div>
      </div>

      <HandleQrSheet open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}
