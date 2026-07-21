import { useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, QrCode, Users } from 'lucide-react';
import { Switch } from '../ui/switch';
import { CIRCLE_ME } from '../../data/circleData';
import { CIRCLE_ACCENT } from './constants';
import { CHAINS } from '../CampaignGallery/chainColors';
import { HandleQrSheet } from './HandleQrSheet';
import { WalletSheet } from './WalletSheet';
import { BlockListSheet } from './BlockListSheet';
import { useWallet, shortAddress } from './walletStore';
import { useBlockedHandles } from './blockStore';
import { toast } from 'sonner@2.0.3';

interface CircleSettingsProps {
  onBack: () => void;
}

type GiftPolicy = 'friends' | 'links' | 'anyone';

// Consolidated Circle settings — everything from the design ⑧ page rolled up
// into one screen. Sections are collapsible-in-spirit only (they always
// render); each row is a compact settings control instead of a link to
// another sub-screen. Reachable from either (a) the gear icon top-right of
// the Circle hub or (b) the single "Circle" entry in the main Settings tab.
export function CircleSettings({ onBack }: CircleSettingsProps) {
  const [notifGifts, setNotifGifts] = useState(true);
  const [notifSubs, setNotifSubs] = useState(true);
  const [giftPolicy, setGiftPolicy] = useState<GiftPolicy>('friends');
  const [qrOpen, setQrOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const wallet = useWallet();
  const blocked = useBlockedHandles();

  const handleCopy = () => {
    navigator.clipboard?.writeText(CIRCLE_ME.handle);
    toast.success('Handle copied');
  };

  return (
    <div className="pb-6 min-h-screen">
      <div className="sticky top-0 z-30 backdrop-blur-md bg-scrim border-b border-glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: CIRCLE_ACCENT }}
            >
              <Users className="w-3.5 h-3.5 text-[#1A1A1A]" />
            </div>
            <div className="text-base font-semibold tracking-tight text-foreground">
              Circle settings
            </div>
          </div>
        </div>
      </div>

      {/* Identity */}
      <Section title="Identity">
        <Row
          label="Your handle"
          detail={CIRCLE_ME.handle}
          trailing={
            <div className="flex items-center gap-1.5">
              <IconChip icon={<QrCode className="w-3.5 h-3.5" />} label="QR" onClick={() => setQrOpen(true)} />
              <IconChip icon={<Copy className="w-3.5 h-3.5" />} label="Copy" onClick={handleCopy} />
            </div>
          }
        />
        <Row
          label="Wallet"
          detail={wallet ? `${CHAINS[wallet.chain].label} · ${shortAddress(wallet.address)}` : 'Not connected'}
          chevron
          onClick={() => setWalletOpen(true)}
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <ToggleRow
          label="Gifts"
          hint="Ping when a friend sends you a tip."
          checked={notifGifts}
          onChange={setNotifGifts}
        />
        <ToggleRow
          label="New sub posts"
          hint="Ping when a creator you follow ships."
          checked={notifSubs}
          onChange={setNotifSubs}
        />
      </Section>

      {/* Privacy */}
      <Section title="Privacy">
        <div className="px-4 py-3 border-b border-white/5">
          <div className="text-sm text-foreground font-medium mb-2">Who can send you gifts</div>
          <div className="space-y-2">
            {(
              [
                { v: 'friends', label: 'Friends only', hint: 'Default. Strangers cannot reach you.' },
                { v: 'links',   label: 'Friends + invite links', hint: 'People with a shared invite link can send.' },
                { v: 'anyone',  label: 'Anyone', hint: 'Open to any handle. Not recommended.' },
              ] as { v: GiftPolicy; label: string; hint: string }[]
            ).map((opt) => (
              <label key={opt.v} className="flex items-start gap-3 cursor-pointer py-1">
                <input
                  type="radio"
                  name="who-can"
                  checked={giftPolicy === opt.v}
                  onChange={() => setGiftPolicy(opt.v)}
                  className="mt-1 accent-amber-500"
                />
                <div>
                  <div className="text-sm text-foreground">{opt.label}</div>
                  <div className="text-xs text-soft-3">{opt.hint}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <Row
          label="Block list"
          detail={blocked.length === 0 ? 'Nobody blocked' : `${blocked.length} blocked`}
          chevron
          onClick={() => setBlockOpen(true)}
        />
      </Section>

      <HandleQrSheet open={qrOpen} onClose={() => setQrOpen(false)} />
      <WalletSheet open={walletOpen} onClose={() => setWalletOpen(false)} />
      <BlockListSheet open={blockOpen} onClose={() => setBlockOpen(false)} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="px-4 mb-2 text-[10px] uppercase tracking-[0.18em] text-amber-400/70">
        {title}
      </div>
      <div className="mx-4 rounded-xl overflow-hidden bg-glass-1 border border-white/10">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  detail,
  chevron,
  trailing,
  muted,
  onClick,
}: {
  label: string;
  detail?: string;
  chevron?: boolean;
  trailing?: React.ReactNode;
  muted?: boolean;
  onClick?: () => void;
}) {
  const base = 'flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-b-0';
  const inner = (
    <>
      <div className="pr-3 min-w-0 text-left">
        <div className={`text-sm font-medium ${muted ? 'text-soft-2' : 'text-foreground'}`}>{label}</div>
        {detail && (
          <div className="text-xs text-soft-3 mt-0.5 truncate">{detail}</div>
        )}
      </div>
      {trailing ?? (chevron ? <ChevronRight className="w-4 h-4 text-soft-4 flex-shrink-0" /> : null)}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} w-full hover:bg-soft-3 active:bg-soft-2 transition-colors`}
      >
        {inner}
      </button>
    );
  }
  return <div className={base}>{inner}</div>;
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
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-b-0">
      <div className="pr-3 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-soft-3 mt-0.5">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function IconChip({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-black/25 border border-white/10 text-foreground hover:border-amber-400/40 transition"
    >
      {icon}
      {label}
    </button>
  );
}
