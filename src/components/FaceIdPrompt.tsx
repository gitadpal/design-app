import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanFace, Check } from 'lucide-react';

interface FaceIdPromptProps {
  open: boolean;
  title?: string;
  subtitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FaceIdPrompt({
  open,
  title = 'Confirm with Face ID',
  subtitle = 'Sign the transaction to continue',
  onConfirm,
  onCancel,
}: FaceIdPromptProps) {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle');

  useEffect(() => {
    if (!open) {
      setPhase('idle');
      return;
    }
    setPhase('scanning');
    const t1 = setTimeout(() => setPhase('done'), 1100);
    const t2 = setTimeout(() => onConfirm(), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, onConfirm]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-t-3xl px-8 pt-10 pb-8 text-center"
            style={{ background: '#1c1c1e', borderTop: '1px solid rgba(255,255,255,0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-28 h-28 mx-auto mb-6">
              {phase === 'scanning' &&
                [0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: '#00FFC2' }}
                    animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.7, 0] }}
                    transition={{ duration: 1.6, delay: i * 0.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                ))}
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: phase === 'done' ? 'rgba(0,255,194,0.18)' : 'rgba(0,255,194,0.12)',
                  border: '2px solid rgba(0,255,194,0.4)',
                }}
              >
                {phase === 'done' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  >
                    <Check className="w-10 h-10" style={{ color: '#00FFC2' }} strokeWidth={3} />
                  </motion.div>
                ) : (
                  <ScanFace className="w-10 h-10" style={{ color: '#00FFC2' }} />
                )}
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">{subtitle}</p>

            <button
              onClick={onCancel}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
