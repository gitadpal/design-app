import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, Image as ImageIcon, ArrowRight, Check } from 'lucide-react';
import { pickRandomSample, type SamplePhoto } from './samplePhotos';
import { getOnboardingTokens, type OnboardingTheme } from './onboardingTheme';

interface StepFirstCastProps {
  onCast: (photo: SamplePhoto) => void;
  theme: OnboardingTheme;
}

type Phase = 'choose' | 'preview' | 'casting' | 'done';

export function StepFirstCast({ onCast, theme }: StepFirstCastProps) {
  const [phase, setPhase] = useState<Phase>('choose');
  const [photo, setPhoto] = useState<SamplePhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tokens = getOnboardingTokens(theme);

  const handleSurprise = () => {
    setPhoto(pickRandomSample());
    setPhase('preview');
  };

  const handleAlbumPick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto({ src: reader.result as string, name: file.name.replace(/\.[^.]+$/, '') });
      setPhase('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleCast = () => {
    if (!photo) return;
    setPhase('casting');
    setTimeout(() => setPhase('done'), 1400);
    setTimeout(() => onCast(photo), 2300);
  };

  return (
    <div
      className="w-full h-full flex flex-col px-7 pt-20 pb-10 relative overflow-hidden"
      style={{ background: tokens.bg }}
    >
      <header className="text-center space-y-2 relative z-10">
        <h2 className="text-2xl font-semibold" style={{ color: tokens.text }}>Cast your first photo</h2>
        <p
          className="text-sm max-w-[280px] mx-auto leading-relaxed"
          style={{ color: tokens.textMuted }}
        >
          Send any image to your E-ink case. We&apos;ll dither it for the screen automatically.
        </p>
      </header>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          {phase === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-2 gap-3"
            >
              <ChoiceCard
                title="Surprise me"
                subtitle="Pick a sample"
                icon={<Sparkles className="w-6 h-6" style={{ color: '#00FFC2' }} />}
                accent="linear-gradient(135deg, rgba(0,255,194,0.18), rgba(0,255,194,0.04))"
                onClick={handleSurprise}
                theme={theme}
              />
              <ChoiceCard
                title="From album"
                subtitle="Choose a photo"
                icon={<ImageIcon className="w-6 h-6" style={{ color: '#BC13FE' }} />}
                accent="linear-gradient(135deg, rgba(188,19,254,0.22), rgba(188,19,254,0.04))"
                onClick={handleAlbumPick}
                theme={theme}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
            </motion.div>
          )}

          {(phase === 'preview' || phase === 'casting' || phase === 'done') && photo && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center"
            >
              <CasePreview src={photo.src} phase={phase} theme={theme} />
              <div className="mt-4 text-center">
                <div className="text-sm font-semibold" style={{ color: tokens.text }}>{photo.name}</div>
                <div
                  className="text-[11px] uppercase tracking-wider mt-0.5"
                  style={{ color: tokens.textDim }}
                >
                  {phase === 'done' ? 'Cast complete' : phase === 'casting' ? 'Transferring…' : 'Ready to cast'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 min-h-[64px]">
        <AnimatePresence>
          {phase === 'preview' && (
            <motion.button
              key="cast-cta"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onClick={handleCast}
              className="w-full rounded-2xl text-base font-semibold text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                height: 52,
                background: 'linear-gradient(135deg, #00FFC2 0%, #BC13FE 100%)',
                boxShadow: '0 12px 40px -8px rgba(0,255,194,0.45)',
              }}
            >
              Cast to Case <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
          {phase === 'choose' && (
            <motion.button
              key="pick-other"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setPhoto(null);
                setPhase('choose');
              }}
              className="w-full h-10 text-sm text-white/40 cursor-default"
            >
              {/* Spacer — keeps height consistent. */}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ChoiceCard({
  title,
  subtitle,
  icon,
  accent,
  onClick,
  theme,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  onClick: () => void;
  theme: OnboardingTheme;
}) {
  const tokens = getOnboardingTokens(theme);
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-5 text-left flex flex-col gap-3 active:scale-[0.98] transition-transform"
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.cardBorder}`,
        minHeight: 130,
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{
          background: accent,
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold" style={{ color: tokens.text }}>{title}</div>
        <div className="text-[11px] mt-0.5" style={{ color: tokens.textDim }}>{subtitle}</div>
      </div>
    </button>
  );
}

function CasePreview({ src, phase, theme }: { src: string; phase: Phase; theme: OnboardingTheme }) {
  const transferring = phase === 'casting';
  const done = phase === 'done';
  const W = 300;
  const H = 432;
  const isDark = theme === 'dark';

  return (
    <div className="relative" style={{ width: W, height: H }}>
      {/* Phone+case frame */}
      <div
        className="absolute inset-0 rounded-[40px] overflow-hidden"
        style={{
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
          background: isDark
            ? 'linear-gradient(160deg, rgba(255,255,255,0.05), transparent)'
            : 'linear-gradient(160deg, rgba(0,0,0,0.04), transparent)',
          boxShadow: isDark
            ? '0 36px 90px -20px rgba(188,19,254,0.32), 0 12px 28px -10px rgba(0,255,194,0.18)'
            : '0 36px 90px -20px rgba(188,19,254,0.20), 0 12px 28px -10px rgba(0,255,194,0.14)',
        }}
      >
        {/* The E-ink face */}
        <div
          className="absolute inset-3 rounded-[30px] overflow-hidden"
          style={{ background: '#1A1A1A' }}
        >
          {/* Original-color image preview */}
          <img
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover select-none"
            draggable={false}
          />

          {/* Refresh sweep when casting */}
          {transferring && (
            <motion.div
              className="absolute inset-x-0"
              style={{
                height: 60,
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.35) 55%, transparent 100%)',
              }}
              initial={{ y: -60 }}
              animate={{ y: H + 20 }}
              transition={{ duration: 1.3, ease: 'linear' }}
            />
          )}

          {/* Done overlay */}
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.35)' }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: '#00FFC2' }}
                >
                  <Check className="w-9 h-9 text-black" strokeWidth={3} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Subtle outer pulse while casting */}
      {transferring && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-[40px] pointer-events-none"
          style={{ boxShadow: '0 0 0 2px rgba(0,255,194,0.5)' }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
