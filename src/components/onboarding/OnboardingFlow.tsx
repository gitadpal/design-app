import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StepWelcome } from './StepWelcome';
import { StepPairDevice } from './StepPairDevice';
import { StepFirstCast } from './StepFirstCast';
import { StepSimulatedEarn } from './StepSimulatedEarn';
import type { SamplePhoto } from './samplePhotos';

export interface OnboardingResult {
  einkCaseAttached: boolean;
  currentDisplay: { type: 'image'; data: { id: string; url: string; name: string } } | null;
}

interface OnboardingFlowProps {
  onComplete: (result: OnboardingResult) => void;
  onSkip: () => void;
}

type Step = 'welcome' | 'pair' | 'cast' | 'earn';
const ORDER: Step[] = ['welcome', 'pair', 'cast', 'earn'];

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [castPhoto, setCastPhoto] = useState<SamplePhoto | null>(null);
  const currentIndex = ORDER.indexOf(step);
  const showChrome = step !== 'welcome';

  const finish = () => {
    onComplete({
      einkCaseAttached: true,
      currentDisplay: castPhoto
        ? { type: 'image', data: { id: 'onboard', url: castPhoto.src, name: castPhoto.name } }
        : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] text-white overflow-hidden">
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
                        : 'rgba(255,255,255,0.18)',
                  }}
                />
              );
            })}
          </div>
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 z-20 text-xs font-medium text-white/55 hover:text-white/90 transition-colors px-3 py-1.5"
          >
            Skip
          </button>
        </>
      )}

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
            <StepWelcome onStart={() => setStep('pair')} onSkip={onSkip} />
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
            <StepPairDevice onPaired={() => setStep('cast')} />
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
            <StepSimulatedEarn castImage={castPhoto} onDone={finish} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ONBOARDING_STORAGE_KEY = 'adpal.onboardingComplete.v1';
