import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Wallet, Coins, Check, ArrowRight } from 'lucide-react';
import type { SamplePhoto } from './samplePhotos';

interface StepSimulatedEarnProps {
  castImage: SamplePhoto | null;
  onDone: () => void;
}

type Beat = 'wallet' | 'campaign' | 'swap' | 'earning' | 'claim' | 'finale';

const BEAT_SEQUENCE: { beat: Beat; ms: number }[] = [
  { beat: 'wallet', ms: 1600 },
  { beat: 'campaign', ms: 1500 },
  { beat: 'swap', ms: 1800 },
  { beat: 'earning', ms: 2400 },
  { beat: 'claim', ms: 1500 },
  { beat: 'finale', ms: 0 },
];

const CAMPAIGN = {
  brand: 'Nike',
  title: 'Air Max 2026',
  reward: 12.5,
  // E-ink-ready creative — dark sneaker silhouette on light bg
  imageGradient: 'linear-gradient(160deg, #1A1A1A 0%, #3a3a3a 100%)',
};

const FAKE_ADDRESS = '0xA1c9...F3E2';

export function StepSimulatedEarn({ castImage, onDone }: StepSimulatedEarnProps) {
  const [beatIndex, setBeatIndex] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const beat = BEAT_SEQUENCE[beatIndex].beat;

  useEffect(() => {
    if (beat === 'finale') return;
    const t = setTimeout(() => setBeatIndex((i) => i + 1), BEAT_SEQUENCE[beatIndex].ms);
    return () => clearTimeout(t);
  }, [beatIndex, beat]);

  // Animate token counter during 'earning' beat
  useEffect(() => {
    if (beat !== 'earning') return;
    const start = Date.now();
    const duration = 2000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setTokenCount(Number((eased * CAMPAIGN.reward).toFixed(1)));
      if (progress >= 1) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [beat]);

  const beatReached = (target: Beat) =>
    BEAT_SEQUENCE.findIndex((b) => b.beat === target) <= beatIndex;

  return (
    <div className="w-full h-full flex flex-col px-7 pt-20 pb-10 bg-[#0A0A0A] relative overflow-hidden">
      <BackdropGlow active={beat !== 'wallet'} />

      <header className="text-center space-y-2 relative z-10">
        <h2 className="text-2xl font-semibold text-white">
          {beat === 'finale' ? "You're all set" : 'Earn your first tokens'}
        </h2>
        <p className="text-sm text-white/55 max-w-[280px] mx-auto leading-relaxed">
          {beat === 'finale'
            ? 'A welcome bonus is on its way to your wallet.'
            : "Sit back — we'll walk you through how a paid cast works."}
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 gap-6">
        <CaseStage castImage={castImage} beat={beat} />

        <div className="w-full space-y-2.5">
          <BeatRow
            label="Connect wallet"
            value={beatReached('campaign') ? FAKE_ADDRESS : 'Signing…'}
            active={beat === 'wallet'}
            done={beatReached('campaign')}
            icon={<Wallet className="w-4 h-4" />}
          />
          <BeatRow
            label="Join campaign"
            value={beatReached('swap') ? `${CAMPAIGN.brand} · ${CAMPAIGN.title}` : 'Finding…'}
            active={beat === 'campaign'}
            done={beatReached('swap')}
            icon={<CampaignDot />}
          />
          <BeatRow
            label="Earn"
            value={beatReached('claim') ? `+${CAMPAIGN.reward} ADPAL` : `+${tokenCount.toFixed(1)} ADPAL`}
            active={beat === 'earning' || beat === 'swap'}
            done={beatReached('claim')}
            icon={<Coins className="w-4 h-4" />}
            valueAccent={beat === 'earning' || beatReached('claim')}
          />
        </div>
      </div>

      <div className="relative z-10 min-h-[64px]">
        <AnimatePresence>
          {beat === 'finale' && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={onDone}
              className="w-full rounded-2xl text-base font-semibold text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                height: 52,
                background: 'linear-gradient(135deg, #00FFC2 0%, #BC13FE 100%)',
                boxShadow: '0 12px 40px -8px rgba(0,255,194,0.45)',
              }}
            >
              Let&apos;s Cast <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Token fly-up during claim beat */}
      <AnimatePresence>{beat === 'claim' && <TokenBurst />}</AnimatePresence>
    </div>
  );
}

function CaseStage({ castImage, beat }: { castImage: SamplePhoto | null; beat: Beat }) {
  const showCampaignCreative = beat === 'swap' || beat === 'earning' || beat === 'claim' || beat === 'finale';

  return (
    <div className="relative w-[170px] h-[250px]">
      <div
        className="absolute inset-0 rounded-[28px] border border-white/15 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.05), transparent)',
          boxShadow: '0 24px 64px -16px rgba(0,255,194,0.18)',
        }}
      >
        <div
          className="absolute inset-2 rounded-[22px] overflow-hidden"
          style={{ background: '#EDE9DC' }}
        >
          {/* User photo */}
          <AnimatePresence>
            {castImage && !showCampaignCreative && (
              <motion.img
                key="user"
                src={castImage.src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: 'grayscale(1) contrast(1.15)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>

          {/* Campaign creative */}
          <AnimatePresence>
            {showCampaignCreative && (
              <motion.div
                key="campaign"
                className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
                style={{ background: CAMPAIGN.imageGradient }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/45 mb-2">
                  {CAMPAIGN.brand}
                </span>
                <span className="text-base font-semibold text-[#EDE9DC]">{CAMPAIGN.title}</span>
                <span className="text-[10px] text-white/35 mt-3">Sponsored cast</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Refresh sweep on swap */}
          {beat === 'swap' && (
            <motion.div
              className="absolute inset-x-0 h-12"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
              }}
              initial={{ y: -50 }}
              animate={{ y: 280 }}
              transition={{ duration: 1.4, ease: 'linear' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BeatRow({
  label,
  value,
  active,
  done,
  icon,
  valueAccent,
}: {
  label: string;
  value: string;
  active: boolean;
  done: boolean;
  icon: React.ReactNode;
  valueAccent?: boolean;
}) {
  const dim = !active && !done;
  return (
    <motion.div
      animate={{ opacity: dim ? 0.35 : 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
      style={{
        background: active ? 'rgba(0,255,194,0.06)' : '#16161A',
        border: `1px solid ${active ? 'rgba(0,255,194,0.25)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: done ? 'rgba(0,255,194,0.18)' : 'rgba(255,255,255,0.06)',
          color: done ? '#00FFC2' : 'rgba(255,255,255,0.7)',
        }}
      >
        {done ? <Check className="w-4 h-4" strokeWidth={3} /> : icon}
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <span className="text-xs text-white/55">{label}</span>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm font-semibold truncate ${valueAccent ? '' : 'text-white'}`}
          style={valueAccent ? { color: '#00FFC2' } : undefined}
        >
          {value}
        </motion.span>
      </div>
    </motion.div>
  );
}

function CampaignDot() {
  return (
    <span
      className="block w-2 h-2 rounded-full"
      style={{ background: 'linear-gradient(135deg, #BC13FE, #00FFC2)' }}
    />
  );
}

function TokenBurst() {
  const tokens = Array.from({ length: 6 });
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {tokens.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #00FFC2 0%, #BC13FE 100%)',
            boxShadow: '0 0 16px rgba(0,255,194,0.6)',
          }}
          initial={{ x: 0, y: 0, scale: 0 }}
          animate={{
            x: (i - tokens.length / 2) * 22,
            y: -180,
            scale: [0, 1, 0.8],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1.2, delay: i * 0.08, ease: 'easeOut' }}
        >
          <Coins className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function BackdropGlow({ active }: { active: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{ opacity: active ? 1 : 0.4 }}
      transition={{ duration: 1.2 }}
    >
      <div
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(0,255,194,0.18) 0%, rgba(188,19,254,0.08) 40%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
    </motion.div>
  );
}
