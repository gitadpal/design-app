import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, Image as ImageIcon, ArrowRight, Check } from 'lucide-react';
import { pickRandomSample, type SamplePhoto } from './samplePhotos';

interface StepFirstCastProps {
  onCast: (photo: SamplePhoto) => void;
}

type Phase = 'choose' | 'preview' | 'casting' | 'done';

export function StepFirstCast({ onCast }: StepFirstCastProps) {
  const [phase, setPhase] = useState<Phase>('choose');
  const [photo, setPhoto] = useState<SamplePhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="w-full h-full flex flex-col px-7 pt-20 pb-10 bg-[#0A0A0A] relative overflow-hidden">
      <header className="text-center space-y-2 relative z-10">
        <h2 className="text-2xl font-semibold text-white">Cast your first photo</h2>
        <p className="text-sm text-white/55 max-w-[280px] mx-auto leading-relaxed">
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
              />
              <ChoiceCard
                title="From album"
                subtitle="Choose a photo"
                icon={<ImageIcon className="w-6 h-6" style={{ color: '#BC13FE' }} />}
                accent="linear-gradient(135deg, rgba(188,19,254,0.22), rgba(188,19,254,0.04))"
                onClick={handleAlbumPick}
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
              <CasePreview src={photo.src} phase={phase} />
              <div className="mt-4 text-center">
                <div className="text-sm font-semibold text-white">{photo.name}</div>
                <div className="text-[11px] uppercase tracking-wider text-white/45 mt-0.5">
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
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-5 text-left flex flex-col gap-3 active:scale-[0.98] transition-transform"
      style={{
        background: '#1C1C1E',
        border: '1px solid rgba(255,255,255,0.08)',
        minHeight: 130,
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: accent, border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-[11px] text-white/45 mt-0.5">{subtitle}</div>
      </div>
    </button>
  );
}

function CasePreview({ src, phase }: { src: string; phase: Phase }) {
  const transferring = phase === 'casting';
  const done = phase === 'done';
  const W = 300;
  const H = 432;

  return (
    <div className="relative" style={{ width: W, height: H }}>
      {/* Phone+case frame */}
      <div
        className="absolute inset-0 rounded-[40px] border border-white/15 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.05), transparent)',
          boxShadow: '0 36px 90px -20px rgba(188,19,254,0.32), 0 12px 28px -10px rgba(0,255,194,0.18)',
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
