import { useCallback, useState } from 'react';
import { ChevronLeft, QrCode, Copy, Share2, CheckCircle2, Sparkles } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { seedTint, avatarForHandle, type Friend } from '../../data/circleData';
import { CIRCLE_ACCENT } from './constants';
import { useAvatarColor, colorToHsl } from './avatarColor';
import { useMyHandle } from './meHandleStore';
import { addFriend, getFriends } from './friendsStore';
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

// Two-word bases used only by the demo "Simulate a scan" button, so a mocked
// scan yields a fresh, plausible friend without a working camera.
const DEMO_SCAN_HANDLES = [
  'willow-brook', 'cedar-finch', 'harbor-lark', 'onyx-marsh',
  'flint-meadow', 'juniper-cove', 'slate-heron', 'maple-wren',
];

export function AddFriend({ onBack, onAdded }: AddFriendProps) {
  const myHandle = useMyHandle();
  const [mode, setMode] = useState<Mode>('scan');
  const [pasted, setPasted] = useState('');
  const [remark, setRemark] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  // The handle from a successful scan (real or simulated). When set, the scan
  // tab swaps its live camera for a confirm card — the scan-flow parallel to
  // the paste tab's inline card.
  const [scanned, setScanned] = useState<string | null>(null);
  const trimmed = pasted.trim().toLowerCase();
  const valid = HANDLE_RE.test(trimmed);

  // Switch tabs, always dropping any pending scan confirm so re-entering the
  // scan tab starts back at the live camera.
  const selectMode = (m: Mode) => {
    setMode(m);
    setScanned(null);
  };

  // A scanned QR carries a Circle handle — either bare (word-word#nnnn) or as an
  // invite link (invite.circle/word-word#nnnn). Pull the handle out, and if it's
  // one of ours, surface the scan confirm card so the user reviews before adding.
  // Returns whether the payload was accepted, so the scanner can keep looking
  // when a non-Circle QR wanders into frame.
  const handleScanDetect = useCallback((value: string): boolean => {
    const candidate = value.split('/').pop()?.trim().toLowerCase() ?? '';
    if (!HANDLE_RE.test(candidate)) return false;
    setScanned(candidate);
    setRemark('');
    toast.success(`Scanned ${candidate} — review & add`);
    return true;
  }, []);

  // Demo-only: fabricate a successful scan so the confirm view is reachable
  // without a working camera. Picks a base not already in the Circle, tags it,
  // and routes through the same detect path a real scan uses.
  const mockScan = () => {
    const takenBases = new Set(getFriends().map((f) => f.handle.split('#')[0]));
    const pool = DEMO_SCAN_HANDLES.filter((b) => !takenBases.has(b));
    const bases = pool.length ? pool : DEMO_SCAN_HANDLES;
    const base = bases[Math.floor(Math.random() * bases.length)];
    const tag = String(Math.floor(1000 + Math.random() * 9000));
    handleScanDetect(`${base}#${tag}`);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(myHandle);
    toast.success('Handle copied');
  };

  const handleShareLink = () => {
    toast.info(`invite.circle/${myHandle}`);
  };

  // Shared add path for both the paste and scan confirm cards.
  const addHandle = (handle: string) => {
    const newFriend: Friend = {
      handle,
      avatarSeed: handle.split('-')[0] || handle,
      avatarUrl: avatarForHandle(handle),
      walletAddress: mockAddress(handle),
      addedAt: new Date().toISOString(),
      sentCount: 0,
      receivedCount: 0,
    };
    addFriend(newFriend);
    const r = remark.trim();
    if (r) setFriendRemark(handle, r);
    toast.success(`Added ${handle} to your Circle`);
    onAdded(handle);
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
                onClick={() => selectMode(m)}
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
          {scanned ? (
            <>
              <div className="flex items-center gap-1.5 mb-3 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                QR scanned — review & add
              </div>
              <FriendConfirmCard
                handle={scanned}
                remark={remark}
                onRemarkChange={setRemark}
                onAdd={() => addHandle(scanned)}
                secondary={{ label: 'Scan again', onClick: () => { setScanned(null); setRemark(''); } }}
              />
            </>
          ) : (
            <>
              <QrScanner active={mode === 'scan'} onDetect={handleScanDetect} />
              <p className="text-center text-sm text-soft-3 mt-4">
                Point at a friend's Circle QR
              </p>
              <button
                onClick={mockScan}
                className="mt-3 w-full h-10 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium border border-dashed border-white/15 text-soft-2 hover:text-foreground hover:border-amber-400/40 transition"
              >
                <Sparkles className="w-3.5 h-3.5" /> Simulate a scan
              </button>
            </>
          )}
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
            <div className="mt-5">
              <FriendConfirmCard
                handle={trimmed}
                remark={remark}
                onRemarkChange={setRemark}
                onAdd={() => addHandle(trimmed)}
              />
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
              {myHandle}
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

// The review card shared by both add flows: the paste tab renders it inline once
// a valid handle is typed; the scan tab renders it after a (real or simulated)
// scan. Shows the target's portrait tinted by a colour sampled from that
// portrait, a "wallet verified" line, an optional remark, and the Add button.
// `secondary` adds a companion button (the scan flow's "Scan again").
function FriendConfirmCard({
  handle,
  remark,
  onRemarkChange,
  onAdd,
  secondary,
}: {
  handle: string;
  remark: string;
  onRemarkChange: (v: string) => void;
  onAdd: () => void;
  secondary?: { label: string; onClick: () => void };
}) {
  // avatarForHandle is deterministic, so this preview matches the avatar the
  // friend will actually be given on add.
  const avatarUrl = avatarForHandle(handle);
  const themeColor = useAvatarColor(avatarUrl, seedTint(handle || 'preview'));
  const [ch, csRaw, clRaw] = colorToHsl(themeColor);
  const cs = Math.min(90, Math.max(45, csRaw));
  const cl = Math.min(62, Math.max(38, clRaw));
  const cardBg = `linear-gradient(135deg, hsla(${ch}, ${cs}%, ${cl}%, 0.24) 0%, hsla(${ch}, ${cs}%, ${cl}%, 0.06) 70%), var(--tint-card-base)`;
  const cardBorder = `hsla(${ch}, ${cs}%, 62%, 0.45)`;

  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3 backdrop-blur-sm"
      style={{ background: cardBg, borderColor: cardBorder }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-black/10 dark:ring-white/15"
          style={{ background: seedTint(handle) }}
        >
          <ImageWithFallback src={avatarUrl} alt={handle} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold tabular-nums text-foreground truncate">{handle}</div>
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
          onChange={(e) => onRemarkChange(e.target.value)}
          placeholder="Add a nickname (optional)"
          className="mt-1.5 w-full h-10 px-3 rounded-lg bg-soft-2 border border-soft-2 text-sm text-foreground placeholder:text-soft-4 focus:outline-none focus:border-amber-400/50"
        />
      </div>

      {secondary ? (
        <div className="flex gap-2">
          <button
            onClick={secondary.onClick}
            className="flex-1 h-11 rounded-xl text-sm font-medium border border-white/10 bg-black/20 text-foreground hover:bg-black/30 transition active:scale-95"
          >
            {secondary.label}
          </button>
          <button
            onClick={onAdd}
            className="flex-1 h-11 rounded-xl text-sm font-semibold text-[#1A1A1A] transition active:scale-95"
            style={{ background: CIRCLE_ACCENT, boxShadow: `0 6px 18px ${CIRCLE_ACCENT}55` }}
          >
            Add to Circle →
          </button>
        </div>
      ) : (
        <button
          onClick={onAdd}
          className="w-full h-11 rounded-xl text-sm font-semibold text-[#1A1A1A] transition active:scale-95"
          style={{ background: CIRCLE_ACCENT, boxShadow: `0 6px 18px ${CIRCLE_ACCENT}55` }}
        >
          Add to Circle →
        </button>
      )}
    </div>
  );
}
