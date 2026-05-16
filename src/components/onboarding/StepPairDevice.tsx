import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bluetooth, Nfc, KeyRound, Check, Hand, Lock } from 'lucide-react';
import { getOnboardingTokens, type OnboardingTheme } from './onboardingTheme';

interface StepPairDeviceProps {
  onPaired: () => void;
  theme: OnboardingTheme;
}

type Phase = 'awaiting' | 'handshaking' | 'found' | 'pairing' | 'done';

const DEVICE_ID = 'A7F3';
const PUBKEY_HEAD = '0x7A3F';
const PUBKEY_TAIL = 'E2B1';

export function StepPairDevice({ onPaired, theme }: StepPairDeviceProps) {
  const [phase, setPhase] = useState<Phase>('awaiting');
  const tokens = getOnboardingTokens(theme);

  useEffect(() => {
    if (phase !== 'awaiting') return;
    const t = setTimeout(() => setPhase('handshaking'), 6600);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'handshaking') return;
    const t = setTimeout(() => setPhase('found'), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  const handlePair = () => {
    setPhase('pairing');
    setTimeout(() => setPhase('done'), 1100);
    setTimeout(() => onPaired(), 2600);
  };

  return (
    <div
      className="w-full h-full flex flex-col px-7 pt-20 pb-10 relative overflow-hidden"
      style={{ background: tokens.bg }}
    >
      <BackdropGlow theme={theme} />

      <header className="text-center space-y-2 relative z-10">
        <h2 className="text-2xl font-semibold" style={{ color: tokens.text }}>Pair your AdPal case</h2>
        <p
          className="text-sm max-w-[280px] mx-auto leading-relaxed"
          style={{ color: tokens.textMuted }}
        >
          Press the case flat against the back of your phone.
        </p>
      </header>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <ContactVisual phase={phase} theme={theme} />
      </div>

      <div className="relative z-10 min-h-[200px]">
        <AnimatePresence mode="wait">
          {phase === 'awaiting' && (
            <motion.div
              key="awaiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm space-y-1"
              style={{ color: tokens.textMuted }}
            >
              <div className="inline-flex items-center gap-2">
                <Nfc className="w-4 h-4 animate-pulse" style={{ color: '#00FFC2' }} />
                Waiting for NFC contact…
              </div>
              <div className="text-[11px]" style={{ color: tokens.textFaint }}>
                Hold the case tightly to your phone
              </div>
            </motion.div>
          )}

          {phase === 'handshaking' && (
            <motion.div
              key="handshaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm space-y-1"
              style={{ color: tokens.textMuted }}
            >
              <div className="inline-flex items-center gap-2">
                <Bluetooth className="w-4 h-4 animate-pulse" style={{ color: '#00FFC2' }} />
                Reading device ID and pubkey…
              </div>
              <div className="text-[11px]" style={{ color: tokens.textFaint }}>
                Keep the case pressed flat
              </div>
            </motion.div>
          )}

          {(phase === 'found' || phase === 'pairing' || phase === 'done') && (
            <motion.div
              key="device"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <DeviceCard phase={phase} theme={theme} />
              <button
                onClick={handlePair}
                disabled={phase !== 'found'}
                className="w-full rounded-2xl text-base font-semibold text-black transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                style={{
                  height: 52,
                  background:
                    phase === 'done'
                      ? 'linear-gradient(135deg, #00FFC2 0%, #00FFC2 100%)'
                      : 'linear-gradient(135deg, #00FFC2 0%, #BC13FE 100%)',
                  boxShadow: '0 12px 40px -8px rgba(0,255,194,0.45)',
                }}
              >
                {phase === 'pairing' ? 'Pairing…' : phase === 'done' ? 'Paired ✓' : 'Pair'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ContactVisual({ phase, theme }: { phase: Phase; theme: OnboardingTheme }) {
  const isAwaiting = phase === 'awaiting';
  const isHandshaking = phase === 'handshaking';
  const isDone = phase === 'done';
  const isPaired = phase === 'pairing' || phase === 'done';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 260 }}>
      {isHandshaking &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: 'rgba(188,19,254,0.5)' }}
            animate={{ scale: [0.55, 1.35], opacity: [0.7, 0] }}
            transition={{
              duration: 1.2,
              delay: i * 0.35,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}

      {isDone ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className="w-32 h-32 rounded-3xl flex items-center justify-center"
          style={{
            background: 'rgba(0,255,194,0.22)',
            border: '2px solid rgba(0,255,194,0.55)',
          }}
        >
          <Check className="w-14 h-14" style={{ color: '#00FFC2' }} strokeWidth={3} />
        </motion.div>
      ) : (
        <PhoneCaseAttach
          attached={!isAwaiting}
          handshaking={isHandshaking}
          locked={isPaired}
          theme={theme}
        />
      )}
    </div>
  );
}

function PhoneCaseAttach({
  attached,
  handshaking,
  locked,
  theme,
}: {
  attached: boolean;
  handshaking: boolean;
  locked: boolean;
  theme: OnboardingTheme;
}) {
  const idle = !attached && !locked;
  const MINT = '#00FFC2';
  const MINT_BORDER = 'rgba(0,255,194,0.7)';

  const PHONE_W = 104;
  const CASE_W = 110;
  const PHONE_H = 210;
  const CASE_H = 220;
  const CONTAINER_W = 280;
  const CONTAINER_H = 260;
  const PHONE_LEFT = (CONTAINER_W - PHONE_W) / 2;
  const PHONE_TOP = 28;
  const CASE_LEFT = (CONTAINER_W - CASE_W) / 2;
  const CASE_TOP = PHONE_TOP - (CASE_H - PHONE_H) / 2;

  return (
    <div className="relative" style={{ width: CONTAINER_W, height: CONTAINER_H }}>
      <div
        className="absolute"
        style={{
          left: PHONE_LEFT,
          top: PHONE_TOP,
          width: PHONE_W,
          height: PHONE_H,
          filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))',
          zIndex: 1,
        }}
      >
        <IPhoneBackSVG theme={theme} />
      </div>

      {idle && (
        <motion.div
          className="absolute"
          initial={{ y: -34, scale: 1 }}
          animate={{ y: 0, scale: 0.99 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.1,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            left: CASE_LEFT,
            top: CASE_TOP,
            width: CASE_W,
            height: CASE_H,
            filter: `drop-shadow(0 6px 14px #00FFC255)`,
            zIndex: 2,
          }}
        >
          <CaseBackSVG accent="#00FFC2" />
        </motion.div>
      )}

      {!idle && (
        <motion.div
          className="absolute"
          initial={{ y: -28, opacity: 0, scale: 1.04 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{
            left: CASE_LEFT,
            top: CASE_TOP,
            width: CASE_W,
            height: CASE_H,
            filter: `drop-shadow(0 6px 16px #BC13FE66)`,
            zIndex: 2,
          }}
        >
          <CaseBackSVG accent="#BC13FE" />
        </motion.div>
      )}

      {idle && (
        <motion.div
          className="absolute pointer-events-none"
          initial={{ x: 24, y: -44, opacity: 0, rotate: -16 }}
          animate={{ x: 4, y: 4, opacity: 1, rotate: -6 }}
          transition={{
            duration: 1.1,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            left: CASE_LEFT + CASE_W / 2 - 18,
            top: CASE_TOP - 36,
            color: MINT,
            filter: `drop-shadow(0 4px 10px ${MINT}55)`,
            zIndex: 3,
          }}
        >
          <Hand className="w-16 h-16" strokeWidth={1.6} />
        </motion.div>
      )}

      {idle && (
        <motion.div
          className="absolute rounded-[26px] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0.8, 0] }}
          transition={{
            duration: 2.2,
            times: [0, 0.45, 0.5, 0.6],
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            left: CASE_LEFT,
            top: CASE_TOP,
            width: CASE_W,
            height: CASE_H,
            boxShadow: `0 0 0 2px ${MINT_BORDER} inset, 0 0 32px ${MINT}90`,
            zIndex: 2,
          }}
        />
      )}

    </div>
  );
}

function DeviceCard({ phase, theme }: { phase: Phase; theme: OnboardingTheme }) {
  const tokens = getOnboardingTokens(theme);
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        boxShadow: theme === 'dark'
          ? '0 8px 24px -12px rgba(0,0,0,0.6)'
          : '0 8px 24px -12px rgba(0,0,0,0.12)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(188,19,254,0.18), rgba(0,255,194,0.18))',
            border: '1px solid rgba(0,255,194,0.25)',
          }}
        >
          <Nfc className="w-5 h-5" style={{ color: '#00FFC2' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: tokens.text }}>AdPal Case</div>
        </div>
        <StatusPill phase={phase} />
      </div>

      <div className="h-px" style={{ background: tokens.divider }} />

      <div className="space-y-2">
        <CredentialRow
          label="Device ID"
          value={DEVICE_ID}
          mono
          theme={theme}
        />
        {phase === 'done' ? (
          <CredentialRow
            label="Public key"
            value={`${PUBKEY_HEAD}…${PUBKEY_TAIL}`}
            icon={<KeyRound className="w-3 h-3" />}
            mono
            theme={theme}
          />
        ) : (
          <CredentialRow
            label="Public key"
            value={phase === 'pairing' ? 'Generating…' : 'Available after pairing'}
            icon={<Lock className="w-3 h-3" />}
            muted
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  icon,
  mono,
  muted,
  theme,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  mono?: boolean;
  muted?: boolean;
  theme: OnboardingTheme;
}) {
  const tokens = getOnboardingTokens(theme);
  const valueColor = muted
    ? tokens.textFaint
    : (theme === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(26,26,26,0.85)');
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider"
        style={{ color: tokens.textDim }}
      >
        {icon}
        {label}
      </span>
      <span
        className={`text-xs ${muted ? 'italic' : ''} ${mono ? 'font-mono' : ''}`}
        style={{ letterSpacing: mono ? '0.04em' : undefined, color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

function StatusPill({ phase }: { phase: Phase }) {
  const label = phase === 'done' ? 'Connected' : phase === 'pairing' ? 'Pairing' : 'Verified';
  const color = phase === 'done' ? '#00FFC2' : phase === 'pairing' ? '#BC13FE' : 'rgba(255,255,255,0.65)';
  return (
    <span
      className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full"
      style={{
        color,
        border: `1px solid ${color}40`,
        background: `${color}14`,
      }}
    >
      {label}
    </span>
  );
}

function IPhoneBackSVG({ theme }: { theme: OnboardingTheme }) {
  const isDark = theme === 'dark';
  const stroke = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(26,26,26,0.7)';
  const subtle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,26,26,0.45)';
  const fillBody = isDark ? 'rgba(28,28,30,0.95)' : 'rgba(220,220,225,0.95)';
  return (
    <svg
      viewBox="0 0 80 162"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="phoneBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isDark ? '#2A2A2C' : '#E8E8EC'} />
          <stop offset="100%" stopColor={isDark ? '#161618' : '#C8C8CE'} />
        </linearGradient>
      </defs>
      <rect
        x="1.5"
        y="1.5"
        width="77"
        height="159"
        rx="14"
        fill="url(#phoneBack)"
        stroke={stroke}
        strokeWidth="1.2"
      />
      <rect
        x="3.5"
        y="3.5"
        width="73"
        height="155"
        rx="12"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.6"
      />
      <rect
        x="7"
        y="10"
        width="66"
        height="30"
        rx="11"
        fill="rgba(0,0,0,0.35)"
        stroke={stroke}
        strokeWidth="0.9"
      />
      <g stroke={stroke} strokeWidth="0.8" fill="rgba(0,0,0,0.55)">
        <circle cx="19" cy="25" r="6" />
        <circle cx="37" cy="25" r="6" />
        <circle cx="55" cy="25" r="6" />
      </g>
      <g fill={subtle}>
        <circle cx="19" cy="25" r="2.5" />
        <circle cx="37" cy="25" r="2.5" />
        <circle cx="55" cy="25" r="2.5" />
      </g>
      <circle cx="66" cy="19" r="1.8" fill="rgba(255,255,255,0.7)" />
      <circle cx="66" cy="31" r="1.8" fill="rgba(120,120,130,0.6)" />
      <rect x="-0.5" y="40" width="2" height="9" rx="0.6" fill={fillBody} stroke={stroke} strokeWidth="0.5" />
      <rect x="-0.5" y="54" width="2" height="14" rx="0.6" fill={fillBody} stroke={stroke} strokeWidth="0.5" />
      <rect x="78.5" y="36" width="2" height="8" rx="0.6" fill={fillBody} stroke={stroke} strokeWidth="0.5" />
      <rect x="78.5" y="56" width="2" height="20" rx="0.6" fill={fillBody} stroke={stroke} strokeWidth="0.5" />
    </svg>
  );
}

function CaseBackSVG({ accent }: { accent: string }) {
  const stroke = accent;
  const eink = 'rgba(245,243,235,0.92)';
  const inkText = 'rgba(20,20,22,0.55)';
  const inkTextSoft = 'rgba(20,20,22,0.28)';
  return (
    <svg
      viewBox="0 0 86 178"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="caseTint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,255,194,0.06)" />
          <stop offset="100%" stopColor="rgba(188,19,254,0.06)" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="84"
        height="176"
        rx="18"
        fill="url(#caseTint)"
        stroke={stroke}
        strokeWidth="1.6"
      />
      <rect
        x="3.5"
        y="3.5"
        width="79"
        height="171"
        rx="15.5"
        fill="none"
        stroke={stroke}
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />
      <rect
        x="9"
        y="11"
        width="68"
        height="32"
        rx="12"
        fill="none"
        stroke={stroke}
        strokeOpacity="0.7"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <g
        fill="none"
        stroke={stroke}
        strokeOpacity="0.55"
        strokeWidth="0.7"
      >
        <circle cx="20" cy="27" r="6.5" />
        <circle cx="40" cy="27" r="6.5" />
        <circle cx="60" cy="27" r="6.5" />
      </g>
      <rect
        x="10"
        y="50"
        width="66"
        height="110"
        rx="4"
        fill={eink}
        stroke={stroke}
        strokeOpacity="0.45"
        strokeWidth="0.8"
      />
      <g fill={inkText}>
        <rect x="14" y="58" width="44" height="3.5" rx="1" />
      </g>
      <g fill={inkTextSoft}>
        <rect x="14" y="65" width="58" height="2" rx="1" />
        <rect x="14" y="69" width="50" height="2" rx="1" />
      </g>
      <rect
        x="29"
        y="82"
        width="28"
        height="28"
        rx="2.5"
        fill="rgba(20,20,22,0.10)"
        stroke="rgba(20,20,22,0.35)"
        strokeWidth="0.5"
      />
      <path
        d="M32 104 L 39 95 L 44 100 L 48 97 L 54 104"
        fill="none"
        stroke="rgba(20,20,22,0.45)"
        strokeWidth="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="91" r="1.6" fill="rgba(20,20,22,0.45)" />
      <rect x="14" y="120" width="40" height="3" rx="1" fill={inkText} />
      <rect x="14" y="126" width="30" height="2" rx="1" fill={inkTextSoft} />
      <rect x="14" y="130" width="34" height="2" rx="1" fill={inkTextSoft} />
      <rect x="-1" y="42" width="3" height="11" rx="1.2" fill="rgba(0,0,0,0.35)" stroke={stroke} strokeOpacity="0.5" strokeWidth="0.6" />
      <rect x="-1" y="56" width="3" height="16" rx="1.2" fill="rgba(0,0,0,0.35)" stroke={stroke} strokeOpacity="0.5" strokeWidth="0.6" />
      <rect x="84" y="38" width="3" height="9" rx="1.2" fill="rgba(0,0,0,0.35)" stroke={stroke} strokeOpacity="0.5" strokeWidth="0.6" />
      <rect x="84" y="60" width="3" height="22" rx="1.2" fill="rgba(0,0,0,0.35)" stroke={stroke} strokeOpacity="0.5" strokeWidth="0.6" />
    </svg>
  );
}

function BackdropGlow({ theme }: { theme: OnboardingTheme }) {
  const isDark = theme === 'dark';
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{ opacity: [0.5, 0.85, 0.5] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(0,255,194,0.18) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(0,255,194,0.28) 0%, rgba(188,19,254,0.10) 45%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </motion.div>
  );
}
