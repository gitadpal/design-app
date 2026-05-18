import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bluetooth, Nfc, KeyRound, Check, Hand, Lock } from 'lucide-react';
import { getOnboardingTokens, type OnboardingTheme } from './onboardingTheme';
import iphone17BackImg from '@/assets/onboarding-samples/attach/iphone17-back.png';
import iphone17CaseImg from '@/assets/onboarding-samples/attach/iphone17-case.png';

interface StepPairDeviceProps {
  onPaired: () => void;
  // Fires the moment the user taps Pair — used by App.tsx to flip the global
  // "device activated" state and toast (same effect as Settings → Activate).
  onActivate: () => void;
  theme: OnboardingTheme;
}

type Phase = 'awaiting' | 'handshaking' | 'found' | 'pairing' | 'done';

const DEVICE_ID = 'A7F3';
const PUBKEY_HEAD = '0x7A3F';
const PUBKEY_TAIL = 'E2B1';

export function StepPairDevice({ onPaired, onActivate, theme }: StepPairDeviceProps) {
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
    // Flip global activation + toast at the moment of tap — same effect path
    // as Settings → Device → Activate, so the two share one source of truth.
    onActivate();
    setTimeout(() => setPhase('done'), 1100);
    setTimeout(() => onPaired(), 2600);
  };

  return (
    <div
      className="w-full h-full flex flex-col px-7 pt-20 pb-10 relative overflow-hidden"
      style={{ background: tokens.bg }}
    >
      <BackdropGlow theme={theme} />

      {/* Staggered reveal: title → description (with a mint-accent highlight
          to draw the eye to the instruction) → device animation → status row.
          Times are absolute delays from mount so the sequence is easy to
          re-tune from one place. */}
      <header className="text-center space-y-2 relative z-10">
        <motion.h2
          className="text-2xl font-semibold"
          style={{ color: tokens.text }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          Pair your AdPal case
        </motion.h2>
        <motion.p
          className="text-sm max-w-[280px] mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 6, color: '#00FFC2' }}
          animate={{ opacity: 1, y: 0, color: tokens.textMuted }}
          transition={{
            opacity: { delay: 0.6, duration: 0.4 },
            y: { delay: 0.6, duration: 0.4 },
            // Mint accent holds for ~0.8s then settles to muted — short
            // "highlight beat" that points the user at the instruction.
            color: { delay: 1.4, duration: 0.7 },
          }}
        >
          Press the case flat against the back of your phone.
        </motion.p>
      </header>

      <motion.div
        className="flex-1 flex items-center justify-center relative z-10"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <ContactVisual phase={phase} theme={theme} />
      </motion.div>

      <div className="relative z-10 min-h-[200px]">
        <AnimatePresence mode="wait">
          {phase === 'awaiting' && (
            <motion.div
              key="awaiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              // Delay only on the first mount, so the row appears after the
              // staggered title → description → animation sequence has played.
              transition={{ delay: 2.2, duration: 0.45 }}
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
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 360 }}>
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
        />
      )}
    </div>
  );
}

function PhoneCaseAttach({
  attached,
  locked,
}: {
  attached: boolean;
  handshaking: boolean;
  locked: boolean;
}) {
  const idle = !attached && !locked;
  const MINT = '#00FFC2';
  // Neutral glow used during the attach loop — before the case has been
  // detected the cue should read as "in progress / waiting", not as success.
  // The mint glow is reserved for the !idle state below.
  const IDLE_GLOW = 'rgba(170,170,180,0.55)';
  const IDLE_BORDER = 'rgba(170,170,180,0.7)';
  const SUCCESS_GLOW = 'rgba(0,255,194,0.45)';

  // Bare iPhone and AdPal case PNGs share the same source dimensions
  // (278 × ~553), so we place them at identical box coordinates and let the
  // transparent case overlay the phone pixel-for-pixel.
  const W = 170;
  const H = 338;
  const CONTAINER_W = 280;
  const CONTAINER_H = 360;
  const LEFT = (CONTAINER_W - W) / 2;
  const TOP = 10;

  return (
    <div className="relative" style={{ width: CONTAINER_W, height: CONTAINER_H }}>
      {/* Edge halo — a rounded-rect sized to the device silhouette, sitting
          BEHIND both PNGs. `box-shadow` blurs outward from this rect's edge,
          so the colored glow only escapes around the outside of the device.
          Using `filter: drop-shadow` on the case PNG instead would leak green
          through the case's transparent cutouts (camera plateau, edge gaps),
          making the iPhone look like it's beaming light from inside. */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none rounded-[30px]"
        animate={{
          boxShadow: idle
            ? `0 6px 18px ${IDLE_GLOW}, 0 0 28px rgba(170,170,180,0.32)`
            : `0 6px 20px ${SUCCESS_GLOW}, 0 0 36px rgba(0,255,194,0.32)`,
        }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          left: LEFT + 6,
          top: TOP + 4,
          width: W - 12,
          height: H - 8,
          zIndex: 0,
        }}
      />

      <img
        src={iphone17BackImg}
        alt=""
        draggable={false}
        className="absolute select-none object-contain"
        style={{
          left: LEFT,
          top: TOP,
          width: W,
          height: H,
          zIndex: 1,
        }}
      />

      {idle && (
        <motion.img
          src={iphone17CaseImg}
          alt=""
          draggable={false}
          className="absolute select-none object-contain"
          initial={{ y: -72, scale: 1 }}
          animate={{ y: 0, scale: 0.99 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.1,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            left: LEFT,
            top: TOP,
            width: W,
            height: H,
            zIndex: 2,
          }}
        />
      )}

      {!idle && (
        <motion.img
          src={iphone17CaseImg}
          alt=""
          draggable={false}
          className="absolute select-none object-contain"
          initial={{ y: -28, opacity: 0, scale: 1.04 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{
            left: LEFT,
            top: TOP,
            width: W,
            height: H,
            zIndex: 2,
          }}
        />
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
            left: LEFT + W / 2 - 18,
            top: TOP - 36,
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
            left: LEFT,
            top: TOP,
            width: W,
            height: H,
            // Pulsing rim during the attach loop — neutral grey, not mint, so
            // it reads as "still waiting" rather than "succeeded".
            boxShadow: `0 0 0 2px ${IDLE_BORDER} inset, 0 0 32px rgba(170,170,180,0.55)`,
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
