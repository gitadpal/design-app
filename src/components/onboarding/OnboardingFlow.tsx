import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { StepWelcome } from './StepWelcome';
import { StepPairDevice } from './StepPairDevice';
import { StepFirstCast } from './StepFirstCast';
import { StepSimulatedEarn } from './StepSimulatedEarn';
import type { SamplePhoto } from './samplePhotos';
import { getOnboardingTokens, type OnboardingTheme } from './onboardingTheme';

export interface OnboardingResult {
  currentDisplay: { type: 'image'; data: { id: string; url: string; name: string } } | null;
}

interface OnboardingFlowProps {
  onComplete: (result: OnboardingResult) => void;
  onSkip: () => void;
  // Fires the moment the Pair step's handshake completes — App uses this to
  // flip the global "device activated" state and toast, so the tutorial's
  // pair click produces the same effect as Settings → Device → Activate.
  onDeviceActivated: () => void;
  theme: OnboardingTheme;
  onToggleTheme: () => void;
}

type Step = 'welcome' | 'pair' | 'cast' | 'earn';
const ORDER: Step[] = ['welcome', 'pair', 'cast', 'earn'];

export function OnboardingFlow({ onComplete, onSkip, onDeviceActivated, theme, onToggleTheme }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [castPhoto, setCastPhoto] = useState<SamplePhoto | null>(null);
  const currentIndex = ORDER.indexOf(step);
  const showChrome = step !== 'welcome';
  const tokens = getOnboardingTokens(theme);
  const isDark = theme === 'dark';

  const finish = () => {
    onComplete({
      currentDisplay: castPhoto
        ? { type: 'image', data: { id: 'onboard', url: castPhoto.src, name: castPhoto.name } }
        : null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: tokens.bg, color: tokens.text }}
    >
      {showChrome && (
        <>
          <div className="absolute top-5 left-0 right-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
            {ORDER.slice(1).map((s, i) => {
              const idx = i + 1;
              const isActive = idx === currentIndex;
              const isDone = idx < currentIndex;
              return (
                <div
                  key={s}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: isActive ? 24 : 8,
                    background:
                      isDone || isActive
                        ? 'linear-gradient(90deg, #BC13FE, #00FFC2)'
                        : tokens.progressTrack,
                  }}
                />
              );
            })}
          </div>
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 z-20 text-xs font-medium transition-colors px-3 py-1.5"
            style={{ color: tokens.textMuted }}
          >
            Skip
          </button>
        </>
      )}

      {/* Dev/debug theme toggle — always visible while tutorial is open so you can
          flip dark/light to verify both palettes without leaving the flow. */}
      <button
        onClick={onToggleTheme}
        aria-label={isDark ? 'Switch tutorial to light mode' : 'Switch tutorial to dark mode'}
        title={`Tutorial: ${isDark ? 'dark' : 'light'} mode (dev toggle)`}
        className="absolute top-4 left-4 z-30 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all active:scale-95"
        style={{
          background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
          color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(26,26,26,0.85)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'}`,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
        {isDark ? 'Dark' : 'Light'}
      </button>

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <StepWelcome theme={theme} onStart={() => setStep('pair')} onSkip={onSkip} />
          </motion.div>
        )}

        {step === 'pair' && (
          <motion.div
            key="pair"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <StepPairDevice
              theme={theme}
              onActivate={onDeviceActivated}
              onPaired={() => setStep('cast')}
            />
          </motion.div>
        )}

        {step === 'cast' && (
          <motion.div
            key="cast"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <StepFirstCast
              theme={theme}
              onCast={(photo) => {
                setCastPhoto(photo);
                setStep('earn');
              }}
            />
          </motion.div>
        )}

        {step === 'earn' && (
          <motion.div
            key="earn"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <StepSimulatedEarn theme={theme} castImage={castPhoto} onDone={finish} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ONBOARDING_STORAGE_KEY = 'adpal.onboardingComplete.v1';
