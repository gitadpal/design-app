import { useCallback, useEffect, useRef, useState } from 'react';
import { Nfc, Check } from 'lucide-react';

interface HoldToCastButtonProps {
  // Origin-page gradient + accent (rose for Cast, amber for Circle).
  gradient: string;
  accent: string;
  // Fires once the hold is held past the commit threshold.
  onCommit: () => void;
  // Hold duration before commit, ms.
  holdMs?: number;
  disabled?: boolean;
}

type Phase = 'idle' | 'holding' | 'committed';

// Press-and-hold cast control, mirroring the campaign gallery's CastSequence:
// touchdown starts a fill; releasing before the threshold aborts cleanly;
// holding past it fires a haptic pulse and commits (the hold IS the
// confirmation — no separate signing step). A progress veil sweeps across the
// button so the build-up is legible, and the label steps through the beats.
export function HoldToCastButton({
  gradient,
  accent,
  onCommit,
  holdMs = 600,
  disabled,
}: HoldToCastButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const committedRef = useRef(false);

  const stopRaf = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const tick = useCallback(() => {
    const p = Math.min(1, (Date.now() - startRef.current) / holdMs);
    setProgress(p);
    if (p >= 1) {
      if (!committedRef.current) {
        committedRef.current = true;
        setPhase('committed');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            (navigator as any).vibrate?.([18, 30, 18]);
          } catch {
            /* haptics unsupported — no-op */
          }
        }
        onCommit();
      }
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [holdMs, onCommit]);

  const begin = () => {
    if (disabled || committedRef.current) return;
    setPhase('holding');
    startRef.current = Date.now();
    stopRaf();
    rafRef.current = requestAnimationFrame(tick);
  };

  // Release before commit = clean abort; after commit the cast is already flying.
  const end = () => {
    if (committedRef.current) return;
    stopRaf();
    setPhase('idle');
    setProgress(0);
  };

  useEffect(() => () => stopRaf(), []);

  const label =
    phase === 'committed' ? 'Casting…' : phase === 'holding' ? 'Hold…' : 'Press & hold to cast';

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={begin}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={end}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-14 rounded-xl font-bold text-base overflow-hidden select-none touch-none transition-transform active:scale-[0.99] disabled:opacity-60"
      style={{
        background: gradient,
        color: '#1A1A1A',
        boxShadow:
          phase === 'idle'
            ? `0 8px 24px ${accent}44`
            : `0 8px 30px ${accent}77, 0 0 18px ${accent}55`,
      }}
    >
      {/* Hold-progress veil sweeping left → right */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-white/30"
        style={{ width: `${progress * 100}%`, transition: phase === 'idle' ? 'width 0.2s ease-out' : 'none' }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2.5">
        {phase === 'committed' ? <Check className="w-5 h-5" /> : <Nfc className="w-5 h-5" />}
        {label}
      </span>
    </button>
  );
}
