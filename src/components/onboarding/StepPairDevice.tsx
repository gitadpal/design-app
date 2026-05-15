import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bluetooth, BatteryFull, Signal, Check } from 'lucide-react';

interface StepPairDeviceProps {
  onPaired: () => void;
}

type Phase = 'scanning' | 'found' | 'pairing' | 'done';

export function StepPairDevice({ onPaired }: StepPairDeviceProps) {
  const [phase, setPhase] = useState<Phase>('scanning');

  useEffect(() => {
    if (phase !== 'scanning') return;
    const t = setTimeout(() => setPhase('found'), 1800);
    return () => clearTimeout(t);
  }, [phase]);

  const handlePair = () => {
    setPhase('pairing');
    setTimeout(() => setPhase('done'), 1100);
    setTimeout(() => onPaired(), 1900);
  };

  return (
    <div className="w-full h-full flex flex-col px-7 pt-20 pb-10 bg-[#0A0A0A] relative overflow-hidden">
      <BackdropGlow />

      <header className="text-center space-y-2 relative z-10">
        <h2 className="text-2xl font-semibold text-white">Pair your AdPal case</h2>
        <p className="text-sm text-white/55 max-w-[280px] mx-auto leading-relaxed">
          Hold your phone near the case and we&apos;ll detect it over Bluetooth.
        </p>
      </header>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <ScanRings phase={phase} />
      </div>

      <div className="relative z-10 min-h-[140px]">
        <AnimatePresence mode="wait">
          {phase === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-white/55"
            >
              <span className="inline-flex items-center gap-2">
                <Bluetooth className="w-4 h-4 animate-pulse" style={{ color: '#00FFC2' }} />
                Scanning for nearby devices…
              </span>
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
              <DeviceCard phase={phase} />
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

function ScanRings({ phase }: { phase: Phase }) {
  const isScanning = phase === 'scanning';
  const isDone = phase === 'done';

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      {isScanning &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: 'rgba(0,255,194,0.55)' }}
            animate={{ scale: [0.6, 1.4], opacity: [0.65, 0] }}
            transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}

      <motion.div
        className="relative w-28 h-28 rounded-full flex items-center justify-center"
        animate={
          isDone
            ? { scale: 1.05, background: 'rgba(0,255,194,0.25)' }
            : { scale: 1, background: 'rgba(0,255,194,0.12)' }
        }
        transition={{ duration: 0.4 }}
        style={{ border: '2px solid rgba(0,255,194,0.45)' }}
      >
        {isDone ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          >
            <Check className="w-12 h-12" style={{ color: '#00FFC2' }} strokeWidth={3} />
          </motion.div>
        ) : (
          <Bluetooth className="w-12 h-12" style={{ color: '#00FFC2' }} />
        )}
      </motion.div>
    </div>
  );
}

function DeviceCard({ phase }: { phase: Phase }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: '#1C1C1E',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px -12px rgba(0,0,0,0.6)',
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(188,19,254,0.18), rgba(0,255,194,0.18))',
          border: '1px solid rgba(0,255,194,0.25)',
        }}
      >
        <Bluetooth className="w-5 h-5" style={{ color: '#00FFC2' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">AdPal Case · A7F3</div>
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-white/50">
          <span className="inline-flex items-center gap-1">
            <Signal className="w-3 h-3" /> Strong
          </span>
          <span className="inline-flex items-center gap-1">
            <BatteryFull className="w-3 h-3" /> 92%
          </span>
        </div>
      </div>
      <StatusPill phase={phase} />
    </div>
  );
}

function StatusPill({ phase }: { phase: Phase }) {
  const label = phase === 'done' ? 'Connected' : phase === 'pairing' ? 'Pairing' : 'Ready';
  const color = phase === 'done' ? '#00FFC2' : phase === 'pairing' ? '#BC13FE' : 'rgba(255,255,255,0.55)';
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

function BackdropGlow() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{ opacity: [0.5, 0.85, 0.5] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,194,0.18) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />
    </motion.div>
  );
}
