import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ScanLine, CameraOff, RefreshCw } from 'lucide-react';
import { CIRCLE_ACCENT } from './constants';

// The native BarcodeDetector API isn't in the TS DOM lib yet. Declare the
// slice we use so the live-decode path stays typed instead of `any`.
type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

interface QrScannerProps {
  /** When true the browser camera is opened and kept live. */
  active: boolean;
  /**
   * Called with each freshly-decoded QR payload. Return true if the value was
   * accepted (scanning latches and stops); return false to keep scanning — the
   * same payload won't fire again, so rejected codes don't spam the callback.
   */
  onDetect: (value: string) => boolean;
}

type Status = 'requesting' | 'live' | 'denied' | 'insecure' | 'unsupported' | 'error';

const RETICLES = [
  { top: 12, left: 12, r: 'nw' },
  { top: 12, right: 12, r: 'ne' },
  { bottom: 12, left: 12, r: 'sw' },
  { bottom: 12, right: 12, r: 'se' },
] as const;

// Live QR scanner. Opens the system camera via getUserMedia (rear camera when
// available) and, where the browser ships BarcodeDetector, decodes QR codes
// straight from the video frames — no third-party decoder is bundled. Browsers
// without the camera or the detector fall back to a clear message pointing at
// the "Paste handle" flow.
export function QrScanner({ active, onDetect }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const latchedRef = useRef(false);
  const handledRef = useRef<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>('requesting');
  // Bump to re-request the camera after a denial/error.
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    handledRef.current.clear();
    latchedRef.current = false;
    setStatus('requesting');
    setAttempt((a) => a + 1);
  }, []);

  // Open / tear down the camera stream. Re-runs when scanning turns on/off or
  // the user retries; always stops every track on cleanup so the camera light
  // goes off the moment we leave the view.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        // Chrome/Safari only expose the camera API on a secure context
        // (https:// or localhost). On a plain-http LAN origin the API is
        // absent entirely — call that out specifically so it's actionable.
        setStatus(window.isSecureContext ? 'unsupported' : 'insecure');
        return;
      }
      setStatus('requesting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setStatus('live');
      } catch (err) {
        if (cancelled) return;
        const name = (err as DOMException)?.name;
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error');
      }
    };

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const video = videoRef.current;
      if (video) video.srcObject = null;
    };
  }, [active, attempt]);

  // Poll the live frames for a QR code using the native detector. Dedupes by
  // raw payload so a rejected code (e.g. a non-Circle QR) is reported once and
  // then ignored, while a valid one latches and halts the loop.
  useEffect(() => {
    if (status !== 'live') return;
    const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (!Ctor) return;

    let detector: BarcodeDetectorLike;
    try {
      detector = new Ctor({ formats: ['qr_code'] });
    } catch {
      return; // detector exists but QR format unsupported — leave feed live
    }

    let raf = 0;
    let timer = 0;
    const tick = async () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !latchedRef.current) {
        try {
          const codes = await detector.detect(video);
          for (const c of codes) {
            const raw = c.rawValue?.trim();
            if (!raw || handledRef.current.has(raw)) continue;
            handledRef.current.add(raw);
            if (onDetect(raw)) {
              latchedRef.current = true;
              return; // stop scheduling — a valid handle was accepted
            }
          }
        } catch {
          // transient decode failure — keep polling
        }
      }
      timer = window.setTimeout(() => {
        raf = requestAnimationFrame(tick);
      }, 300);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [status, onDetect, attempt]);

  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-[#0e0d0a]">
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          status === 'live' ? 'opacity-100' : 'opacity-0'
        }`}
        muted
        playsInline
        autoPlay
      />

      {/* Non-live states */}
      {status !== 'live' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
          {status === 'requesting' && (
            <>
              <ScanLine className="w-12 h-12 animate-pulse" style={{ color: CIRCLE_ACCENT, opacity: 0.5 }} />
              <p className="text-sm text-soft-3">Opening camera…</p>
            </>
          )}
          {(status === 'denied' || status === 'error') && (
            <>
              <CameraOff className="w-11 h-11 text-soft-4" />
              <p className="text-sm text-soft-2">
                {status === 'denied' ? 'Camera access blocked' : "Couldn't open the camera"}
              </p>
              <p className="text-xs text-soft-4 leading-relaxed">
                {status === 'denied'
                  ? 'Allow camera access in your browser, or switch to Paste handle.'
                  : 'Something went wrong. Try again, or switch to Paste handle.'}
              </p>
              <button
                onClick={retry}
                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/30 border border-white/10 text-foreground hover:bg-black/50 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </>
          )}
          {status === 'insecure' && (
            <>
              <CameraOff className="w-11 h-11 text-soft-4" />
              <p className="text-sm text-soft-2">Camera needs a secure connection</p>
              <p className="text-xs text-soft-4 leading-relaxed">
                Browsers only open the camera over <span className="font-mono">https://</span> or{' '}
                <span className="font-mono">localhost</span>. Open this page over https, or use
                Paste handle.
              </p>
            </>
          )}
          {status === 'unsupported' && (
            <>
              <CameraOff className="w-11 h-11 text-soft-4" />
              <p className="text-sm text-soft-2">Camera not available</p>
              <p className="text-xs text-soft-4 leading-relaxed">
                This browser can't open the camera here. Use Paste handle instead.
              </p>
            </>
          )}
        </div>
      )}

      {/* Corner reticles — framing guide, always visible */}
      {RETICLES.map((p, i) => (
        <div key={i} className="absolute w-8 h-8" style={{ ...p }}>
          <div
            className="w-full h-full"
            style={{
              borderTop: p.r === 'nw' || p.r === 'ne' ? `2px solid ${CIRCLE_ACCENT}` : 'none',
              borderBottom: p.r === 'sw' || p.r === 'se' ? `2px solid ${CIRCLE_ACCENT}` : 'none',
              borderLeft: p.r === 'nw' || p.r === 'sw' ? `2px solid ${CIRCLE_ACCENT}` : 'none',
              borderRight: p.r === 'ne' || p.r === 'se' ? `2px solid ${CIRCLE_ACCENT}` : 'none',
              borderRadius: 6,
            }}
          />
        </div>
      ))}

      {/* Scan sweep — only while the feed is live */}
      {status === 'live' && (
        <motion.div
          className="absolute left-6 right-6 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${CIRCLE_ACCENT}, transparent)`,
            boxShadow: `0 0 8px ${CIRCLE_ACCENT}`,
          }}
          initial={{ top: '15%' }}
          animate={{ top: ['15%', '85%', '15%'] }}
          transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity }}
        />
      )}
    </div>
  );
}
