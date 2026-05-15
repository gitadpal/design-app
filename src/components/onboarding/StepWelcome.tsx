import { createContext, useContext, useEffect, useState } from 'react';
import { animate, motion, useMotionTemplate, useMotionValue, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import iphoneBackImg from 'figma:asset/771d461e7de4d0c40d4ef5fcc5c59768d30ec60e.png';
import { samplePhotos } from './samplePhotos';

// Slot timing — the sweep and the image reveal share this cadence.
const SLOT_SECONDS = 3.5; // one image per sweep
const SWEEP_TRAVEL_FRACTION = 0.85; // fraction of the slot during which the sweep travels

// One global color cycle drives the silk wash tint, the E-ink image overlay, and the
// "Get Started" button background. They all breathe through the same Prism palette in
// lockstep, so the page feels like a single living color organism.
//
// Instead of a fixed linear cycle, the phase hops between random palette stops — each
// hop animates over a short eased duration, and the next target is picked when the
// current one settles. The page never repeats the same color sequence twice.
const COLOR_CYCLE_KEYS = [0, 1, 2, 3, 4];
const COLOR_CYCLE_A = ['#BC13FE', '#FF5AC8', '#00FFC2', '#4678FF', '#7D3CFF'];
const COLOR_CYCLE_B = ['#00FFC2', '#4678FF', '#FF5AC8', '#9A4DFF', '#00FFC2'];
// Per-hop timing: a base settle + a distance-aware glide + a jitter so it never feels
// mechanical. Average hop ≈ 3s — meaningfully faster than the old 24s sweep.
const HOP_BASE_SECONDS = 1.2;
const HOP_PER_DISTANCE = 0.9;
const HOP_JITTER_SECONDS = 0.6;

interface ThemeColors {
  colorA: MotionValue<string>;
  colorB: MotionValue<string>;
  gradient: MotionValue<string>;
}

const ThemeColorContext = createContext<ThemeColors | null>(null);

function useThemeColors(): ThemeColors {
  const ctx = useContext(ThemeColorContext);
  if (!ctx) throw new Error('useThemeColors must be used inside ThemeColorProvider');
  return ctx;
}

function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const phase = useMotionValue(0);

  useEffect(() => {
    let cancelled = false;
    let current = 0;
    let controls: ReturnType<typeof animate> | null = null;

    const hop = () => {
      if (cancelled) return;
      // Pick any palette index other than the current — random *direction* and
      // random *distance*, so the gradient may step forward, jump backward,
      // or skip several stops in either direction.
      let next = current;
      while (next === current) {
        next = Math.floor(Math.random() * COLOR_CYCLE_A.length);
      }
      const distance = Math.abs(next - current);
      const duration =
        HOP_BASE_SECONDS + HOP_PER_DISTANCE * distance + Math.random() * HOP_JITTER_SECONDS;
      current = next;

      controls = animate(phase, next, {
        duration,
        ease: 'easeInOut',
        onComplete: () => hop(),
      });
    };

    hop();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [phase]);

  const colorA = useTransform(phase, COLOR_CYCLE_KEYS, COLOR_CYCLE_A);
  const colorB = useTransform(phase, COLOR_CYCLE_KEYS, COLOR_CYCLE_B);
  const gradient = useMotionTemplate`linear-gradient(160deg, ${colorA} 0%, ${colorB} 100%)`;

  return (
    <ThemeColorContext.Provider value={{ colorA, colorB, gradient }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

interface StepWelcomeProps {
  onStart: () => void;
  onSkip: () => void;
}

export function StepWelcome({ onStart, onSkip }: StepWelcomeProps) {
  return (
    <ThemeColorProvider>
      <StepWelcomeInner onStart={onStart} onSkip={onSkip} />
    </ThemeColorProvider>
  );
}

function StepWelcomeInner({ onStart, onSkip }: StepWelcomeProps) {
  const { gradient } = useThemeColors();
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0A0A0A]">
      <AnimatedBackdrop />

      {/* Full-bleed hero device */}
      <PhoneCaseScene />

      {/* Bottom legibility scrim — fades the device into a dark plate for the text */}
      <div
        className="absolute inset-x-0 bottom-0 h-[58%] pointer-events-none z-[5]"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(10,10,10,0.55) 38%, rgba(10,10,10,0.92) 72%, #0A0A0A 100%)',
        }}
      />

      {/* Text + CTAs overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-8 pb-10 pt-6 space-y-6">
        <div className="text-center space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[30px] leading-[1.1] font-semibold text-white"
          >
            Earn while your<br />phone rests.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[11px] font-semibold uppercase"
            style={{
              letterSpacing: '0.42em',
              // Trailing letter-spacing pushes the line off-center by half an em;
              // a matching left padding re-centers it under the headline.
              paddingLeft: '0.42em',
              color: 'rgba(255,255,255,0.82)',
              textShadow:
                '0 0 12px rgba(0,255,194,0.28), 0 1px 0 rgba(0,0,0,0.4)',
            }}
          >
            Cast <span style={{ color: 'rgba(0,255,194,0.85)' }}>·</span> Earn{' '}
            <span style={{ color: 'rgba(188,19,254,0.85)' }}>·</span> Play
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="space-y-2"
        >
          <motion.button
            onClick={onStart}
            className="w-full rounded-2xl text-base font-semibold text-black transition-transform active:scale-[0.98]"
            style={{
              background: gradient,
              height: 52,
              boxShadow: '0 12px 40px -8px rgba(0,255,194,0.45)',
            }}
          >
            Get Started
          </motion.button>
          <button
            onClick={onSkip}
            className="w-full h-10 text-sm font-medium text-white/55 hover:text-white/85 transition-colors"
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// A single overlay that paints the live theme gradient with `mix-blend-mode: color`.
// Used over the E-ink image so its hue tracks the rest of the page in real time.
function ThemedColorWash() {
  const { gradient } = useThemeColors();
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ background: gradient, mixBlendMode: 'color' }}
    />
  );
}

function BokehLights() {
  // Out-of-focus light circles — large, bright, soft-edged. They drift slowly along
  // the BG and act as the strongest depth cue (real DOF photos always have these).
  const orbs = [
    { size: 220, color: 'rgba(0,255,194,0.50)', left: '12%', top: '20%', dur: 36, dx: 30, dy: 22 },
    { size: 180, color: 'rgba(188,19,254,0.55)', left: '74%', top: '30%', dur: 42, dx: -28, dy: 18 },
    { size: 260, color: 'rgba(0,255,194,0.40)', left: '60%', top: '70%', dur: 48, dx: -22, dy: -32 },
    { size: 150, color: 'rgba(255,90,200,0.50)', left: '22%', top: '78%', dur: 38, dx: 24, dy: -26 },
    { size: 140, color: 'rgba(70,180,255,0.50)', left: '85%', top: '60%', dur: 50, dx: -18, dy: 28 },
    { size: 110, color: 'rgba(255,255,255,0.35)', left: '40%', top: '15%', dur: 44, dx: 20, dy: 14 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: o.size,
            height: o.size,
            left: o.left,
            top: o.top,
            marginLeft: -o.size / 2,
            marginTop: -o.size / 2,
            // Bokeh edge profile — bright center, ring-ish midtone, soft falloff.
            background: `radial-gradient(circle, ${o.color} 0%, ${o.color.replace(/0\.\d+\)/, '0.18)')} 45%, transparent 75%)`,
            filter: 'blur(18px)',
            mixBlendMode: 'screen',
            willChange: 'transform',
          }}
          animate={{
            x: [0, o.dx, 0, -o.dx, 0],
            y: [0, o.dy, o.dy * 0.4, -o.dy * 0.6, 0],
          }}
          transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function ThemedSilkTint() {
  // Wash over the silk-river using the same live gradient. mix-blend-mode "color" pushes
  // the underlying ribbons into the current theme palette, so the BG visibly shifts
  // through Violet → Magenta → Mint → Indigo → Violet in sync with the image + button.
  const { gradient } = useThemeColors();
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ background: gradient, mixBlendMode: 'color', opacity: 0.55 }}
    />
  );
}

function AnimatedBackdrop() {
  // Silk-river flow — wide diagonal ribbons translate continuously across the viewport.
  // Each ribbon carries multiple gradient "peaks" so a new peak always enters from one side
  // as another exits, giving a continuous, visibly-flowing river current.
  // Pattern width = 50% of the ribbon's 400% width, animated by -50% over the duration
  // produces a seamless loop.
  const ribbons = [
    {
      angle: 14,
      top: '-5%',
      duration: 16,
      reverse: false,
      gradient:
        'linear-gradient(90deg, transparent 0%, rgba(188,19,254,0.85) 12%, transparent 25%, transparent 50%, rgba(188,19,254,0.65) 62%, transparent 75%, transparent 100%)',
    },
    {
      angle: -10,
      top: '22%',
      duration: 19,
      reverse: true,
      gradient:
        'linear-gradient(90deg, transparent 0%, rgba(0,255,194,0.85) 15%, transparent 30%, transparent 55%, rgba(0,255,194,0.6) 68%, transparent 82%, transparent 100%)',
    },
    {
      angle: 22,
      top: '50%',
      duration: 24,
      reverse: false,
      gradient:
        'linear-gradient(90deg, transparent 0%, rgba(70,120,255,0.7) 18%, transparent 35%, transparent 60%, rgba(70,120,255,0.5) 72%, transparent 88%, transparent 100%)',
    },
    {
      angle: -18,
      top: '72%',
      duration: 28,
      reverse: true,
      gradient:
        'linear-gradient(90deg, transparent 0%, rgba(255,90,200,0.6) 14%, transparent 28%, transparent 58%, rgba(255,90,200,0.5) 70%, transparent 84%, transparent 100%)',
    },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Deep base wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(40,10,60,0.55) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(0,60,55,0.5) 0%, transparent 60%)',
        }}
      />

      {ribbons.map((r, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: r.top,
            left: '-100%',
            width: '300%',
            height: '46%',
            transform: `rotate(${r.angle}deg)`,
            transformOrigin: 'center',
            overflow: 'hidden',
          }}
        >
          <motion.div
            className="absolute top-0 h-full"
            style={{
              width: '400%',
              left: 0,
              background: r.gradient,
              backgroundSize: '50% 100%',
              backgroundRepeat: 'repeat-x',
              filter: 'blur(50px)',
              mixBlendMode: 'screen',
              willChange: 'transform',
            }}
            animate={{ x: r.reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
            transition={{ duration: r.duration, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ))}

      {/* Bokeh orbs — out-of-focus light circles drift across the BG. These read as
          characteristic "depth-of-field bokeh," signaling the BG is the far plane. */}
      <BokehLights />

      {/* Atmospheric haze plane — a thin diffuse layer that veils the BG behind the
          phone, like the light scatter you get with a long-lens shot. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% 32%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 30%, transparent 65%)',
          filter: 'blur(20px)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Live theme tint — pulls the whole silk-river into the page's current palette. */}
      <ThemedSilkTint />

      {/* Stronger edge vignette so the corners darken and the BG recedes. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Silk shimmer — soft cross-cutting highlight that breathes for "fabric" feel */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(110deg, transparent 0%, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%, transparent 100%)',
          mixBlendMode: 'screen',
        }}
        animate={{ x: ['-30%', '30%', '-30%'], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Slow rotating conic — keeps the palette shifting under the ribbons */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'conic-gradient(from 0deg at 50% 50%, rgba(0,255,194,0.10) 0deg, transparent 90deg, rgba(188,19,254,0.10) 180deg, transparent 270deg, rgba(0,255,194,0.10) 360deg)',
          filter: 'blur(40px)',
          mixBlendMode: 'screen',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      />

      {/* Film grain on top */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

function PhoneCaseScene() {
  // Source asset: 360px-wide reference with E-ink screen overlay at top:222 left:99 w:168 h:250.
  // We scale to 520px so the device runs nearly edge-to-edge (design width is 448px),
  // letting the phone bleed past the viewport edges for an immersive hero.
  const W = 520;
  const F = W / 360;
  const screen = {
    top: 222 * F,
    left: 99 * F,
    width: 168 * F,
    height: 250 * F,
    radius: 7 * F,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-[2]"
      style={{
        width: W,
        top: -30,
        // Layered shadows for foreground depth: a soft contact halo, a colored bloom,
        // and a long ambient shadow — the case visibly hovers above the receded BG.
        filter:
          'drop-shadow(0 8px 16px rgba(0,0,0,0.55)) drop-shadow(0 48px 90px rgba(188,19,254,0.42)) drop-shadow(0 20px 40px rgba(0,255,194,0.22))',
      }}
    >
      <div className="relative">
        <img
          src={iphoneBackImg}
          alt="AdPal Device"
          className="w-full h-auto object-contain select-none"
          draggable={false}
        />

        {/* E-ink screen overlay — sweep-driven image reveal */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: screen.top,
            left: screen.left,
            width: screen.width,
            height: screen.height,
            borderRadius: screen.radius,
            background: '#EDE9DC',
          }}
        >
          <EinkSweepReveal screenHeight={screen.height} />

          {/* Subtle paper sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/15 pointer-events-none" />
        </div>
      </div>
    </motion.div>
  );
}

// Image color-graded to the page's Prism theme: the photo's luminance (shapes/details)
// stays intact, but its hue and saturation are replaced by the AdPal Violet→Mint gradient
// via `mix-blend-mode: color`. Result: any source photo reads as a brand-tinted object.
function BrandTintedImage({ src }: { src: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
        // Slight contrast boost so the luminance detail reads cleanly through the tint.
        style={{ filter: 'contrast(1.1) brightness(1.04)' }}
      />
      {/* Brand color graft — replaces the photo's hue+saturation with the live Prism
          gradient (which cycles in sync with the silk-river and the CTA button), while
          keeping the image's luminance for shape/detail. */}
      <ThemedColorWash />

      {/* Highlight sparkle — a subtle prism sheen on the bright areas, blended with
          overlay so it catches highlights without affecting shadows. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(45deg, rgba(0,255,194,0.22) 0%, transparent 45%, rgba(188,19,254,0.22) 100%)',
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}

function EinkSweepReveal({ screenHeight }: { screenHeight: number }) {
  // E-ink-style refresh: the previous image sits as the static backdrop. A new image is
  // revealed top-down in perfect lockstep with the sweep bar — at sweep position 35%,
  // the top 35% of the new image is visible; the bottom 65% still shows the previous.
  // After the sweep completes, the new image becomes the backdrop and the cycle repeats.
  const photos = samplePhotos.slice(0, Math.min(5, samplePhotos.length));
  const n = photos.length;
  const SWEEP_HEIGHT = 56;
  const sweepDurationSec = SLOT_SECONDS * SWEEP_TRAVEL_FRACTION;

  // `idx` is the image currently being revealed. `prevIdx` is the settled backdrop.
  // `hasCycled` flips true after the first reveal completes, so the very first cycle
  // shows the default gray screen as the "previous" instead of wrapping to the last image.
  const [idx, setIdx] = useState(0);
  const [hasCycled, setHasCycled] = useState(false);

  useEffect(() => {
    if (n <= 1) return;
    const tick = setInterval(() => {
      setHasCycled(true);
      setIdx((i) => (i + 1) % n);
    }, SLOT_SECONDS * 1000);
    return () => clearInterval(tick);
  }, [n]);

  const prevIdx = (idx - 1 + n) % n;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Default gray screen — always present as the very bottom layer */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, #1A1A1A 0%, #3a3a3a 100%)' }}
      />

      {/* Previously-revealed image becomes the settled backdrop after the first cycle */}
      {hasCycled && photos[prevIdx] && (
        <BrandTintedImage src={photos[prevIdx].src} />
      )}

      {/* Current image being revealed — keyed by idx so it remounts at each cycle and
          its clip-path animation restarts in lockstep with the sweep bar below. */}
      {photos[idx] && (
        <motion.div
          key={`reveal-${idx}`}
          className="absolute inset-0"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          transition={{ duration: sweepDurationSec, ease: [0.45, 0, 0.55, 1] }}
        >
          <BrandTintedImage src={photos[idx].src} />
        </motion.div>
      )}

      {/* Image tear strips — thin horizontal bands of the current image displaced
          horizontally as the sweep passes, like a CRT/data-stream tearing artifact. */}
      {photos[idx] && (
        <ImageTearStrips
          key={`tear-${idx}`}
          src={photos[idx].src}
          duration={sweepDurationSec}
        />
      )}

      {/* Sweep bar — same key cadence and easing as the reveal so they move as one.
          The sweep's vertical center starts at the screen top (y = -SWEEP_HEIGHT/2)
          and travels to the screen bottom (y = screenHeight - SWEEP_HEIGHT/2), so the
          center of the dark band always sits exactly at the reveal line. */}
      <motion.div
        key={`sweep-${idx}`}
        className="absolute inset-x-0 pointer-events-none"
        style={{
          height: SWEEP_HEIGHT,
          // Layered: a dark scan band + scanline striping inside it for an E-ink/CRT feel.
          background:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0 1px, transparent 1px 3px), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.22) 45%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.22) 55%, transparent 100%)',
        }}
        initial={{ y: -SWEEP_HEIGHT / 2, opacity: 1 }}
        animate={{ y: screenHeight - SWEEP_HEIGHT / 2, opacity: [1, 1, 0] }}
        transition={{
          duration: sweepDurationSec,
          times: [0, 0.95, 1],
          ease: [0.45, 0, 0.55, 1],
        }}
      />

      {/* Bright leading edge — a thin neon scan line glides at the exact reveal boundary,
          like a laser-refresh head making contact with the screen. */}
      <motion.div
        key={`edge-${idx}`}
        className="absolute inset-x-0 pointer-events-none"
        style={{
          height: 1.5,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(0,255,194,0.95) 25%, rgba(255,255,255,1) 50%, rgba(188,19,254,0.95) 75%, transparent 100%)',
          boxShadow:
            '0 0 8px rgba(0,255,194,0.9), 0 0 14px rgba(188,19,254,0.55)',
          mixBlendMode: 'screen',
        }}
        initial={{ y: 0 }}
        animate={{ y: screenHeight, opacity: [0, 1, 1, 0] }}
        transition={{
          duration: sweepDurationSec,
          times: [0, 0.05, 0.95, 1],
          ease: [0.45, 0, 0.55, 1],
        }}
      />

      {/* RGB chromatic aberration at the edge — a thin red shift just above the scan
          line and a cyan shift just below. Reads as a digital-imaging artifact. */}
      <motion.div
        key={`chroma-${idx}`}
        className="absolute inset-x-0 pointer-events-none"
        style={{
          height: 5,
          background:
            'linear-gradient(to bottom, rgba(255,40,80,0.7) 0%, rgba(255,40,80,0.7) 40%, transparent 40%, transparent 60%, rgba(40,220,255,0.7) 60%, rgba(40,220,255,0.7) 100%)',
          mixBlendMode: 'screen',
          transform: 'translateY(-2.5px)',
        }}
        initial={{ y: 0 }}
        animate={{ y: screenHeight, opacity: [0, 0.8, 0.8, 0] }}
        transition={{
          duration: sweepDurationSec,
          times: [0, 0.05, 0.95, 1],
          ease: [0.45, 0, 0.55, 1],
        }}
      />

      {/* Glitch scratches — short-lived bright streaks flash at randomized vertical
          positions during the sweep, simulating digital-scan tear artifacts. */}
      <GlitchScratches key={`glitch-${idx}`} screenHeight={screenHeight} duration={sweepDurationSec} />

      {/* Digital noise dust inside the sweep band — adds a fine grain that moves with
          the sweep, selling the "data being scanned" feel. */}
      <motion.div
        key={`noise-${idx}`}
        className="absolute inset-x-0 pointer-events-none"
        style={{
          height: SWEEP_HEIGHT,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
          mixBlendMode: 'screen',
          opacity: 0.22,
        }}
        initial={{ y: -SWEEP_HEIGHT / 2 }}
        animate={{ y: screenHeight - SWEEP_HEIGHT / 2, opacity: [0.22, 0.22, 0] }}
        transition={{
          duration: sweepDurationSec,
          times: [0, 0.9, 1],
          ease: [0.45, 0, 0.55, 1],
        }}
      />
    </div>
  );
}

function ImageTearStrips({ src, duration }: { src: string; duration: number }) {
  // Each tear is a thin horizontal band of the image displaced left/right for a few
  // hundred ms, then snapped back into alignment. Tear delays are placed where the sweep
  // passes through that band so the tear reads as caused by the scan crossing the image.
  // Each candidate fires with ~35% probability per cycle, so most sweeps show 0–2 tears
  // rather than the full set — keeps the artifact rare and surprising.
  const allTears = [
    { delay: 0.15, topPct: 14, heightPct: 2.2, dx: -18, dur: 0.10 },
    { delay: 0.30, topPct: 32, heightPct: 1.4, dx: 14, dur: 0.08 },
    { delay: 0.45, topPct: 48, heightPct: 3.0, dx: -12, dur: 0.12 },
    { delay: 0.60, topPct: 64, heightPct: 1.8, dx: 20, dur: 0.09 },
    { delay: 0.78, topPct: 82, heightPct: 2.4, dx: -16, dur: 0.10 },
  ];
  const tears = allTears.filter(() => Math.random() < 0.35);
  return (
    <>
      {tears.map((t, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            clipPath: `inset(${t.topPct}% 0 ${100 - t.topPct - t.heightPct}% 0)`,
            // Slight contrast/glow so the torn slice reads as a "hot" artifact, not just
            // a duplicate of the image.
            filter: 'brightness(1.15) saturate(1.2)',
          }}
          initial={{ opacity: 0, x: 0 }}
          animate={{
            opacity: [0, 1, 1, 0.6, 0],
            x: [t.dx, t.dx, t.dx * 0.4, 0, 0],
          }}
          transition={{
            duration: duration * t.dur,
            delay: duration * t.delay,
            times: [0, 0.1, 0.55, 0.85, 1],
            ease: 'easeOut',
          }}
        >
          <BrandTintedImage src={src} />
          {/* Tear edge highlights — thin neon lines at top + bottom of the strip for a
              "data slice" feel. */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, #00FFC2, transparent)',
              boxShadow: '0 0 4px #00FFC2',
              mixBlendMode: 'screen',
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, #BC13FE, transparent)',
              boxShadow: '0 0 4px #BC13FE',
              mixBlendMode: 'screen',
            }}
          />
        </motion.div>
      ))}
    </>
  );
}

function GlitchScratches({ screenHeight, duration }: { screenHeight: number; duration: number }) {
  // Each scratch flashes once at a different point during the sweep, at a different
  // vertical position. Picked at mount and remounted via parent key per cycle.
  // ~30% probability per candidate so most cycles show 1–2 scratches rather than all five.
  const allScratches = [
    { delay: 0.12, top: 0.18, height: 1, color: '#00FFC2', dur: 0.09, xJitter: -10 },
    { delay: 0.32, top: 0.42, height: 2, color: '#BC13FE', dur: 0.07, xJitter: 8 },
    { delay: 0.5, top: 0.30, height: 1, color: '#FFFFFF', dur: 0.06, xJitter: -6 },
    { delay: 0.62, top: 0.65, height: 1.5, color: '#FF5AC8', dur: 0.08, xJitter: 12 },
    { delay: 0.78, top: 0.85, height: 1, color: '#4678FF', dur: 0.07, xJitter: -10 },
  ];
  const scratches = allScratches.filter(() => Math.random() < 0.3);
  return (
    <>
      {scratches.map((s, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: s.top * screenHeight,
            left: '-4%',
            right: '-4%',
            height: s.height,
            background: s.color,
            boxShadow: `0 0 6px ${s.color}, 0 0 10px ${s.color}99`,
            mixBlendMode: 'screen',
          }}
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: [0, 0.95, 0], x: [s.xJitter, 0, 2] }}
          transition={{
            duration: duration * s.dur,
            delay: duration * s.delay,
            times: [0, 0.35, 1],
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  );
}
