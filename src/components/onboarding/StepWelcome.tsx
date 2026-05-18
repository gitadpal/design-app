import { createContext, useContext, useEffect, useState } from 'react';
import { animate, AnimatePresence, motion, useMotionTemplate, useMotionValue, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import iphoneBackWhiteImg from 'figma:asset/771d461e7de4d0c40d4ef5fcc5c59768d30ec60e.png';
import iphoneBackOrangeImg from '@/assets/iphone-case-orange.png';
import { samplePhotosByCategory, type SampleCategory } from './samplePhotos';
import { getOnboardingTokens, type OnboardingTheme } from './onboardingTheme';

// Rotating headline copy. Two angles on the product, each paired with a case
// color so the device shifts as the message shifts:
//   0. Earn  — white case, passive income while the phone is idle
//   1. Play  — orange case, cast art that moves you (Play pillar)
// The pair swaps every TITLE_HOLD_MS with a glitch-scratch transition shared
// by both the headline and the case image.
const TITLES: Array<{
  lines: [string, string];
  caseImg: string;
  color: string;
  category: SampleCategory;
  holdMs: number;
}> = [
  // White case → white headline (default) → ads/monetization e-ink images.
  {
    lines: ['Earn while your', 'phone rests.'],
    caseImg: iphoneBackWhiteImg,
    color: '#FFFFFF',
    category: 'earn',
    holdMs: 8000,
  },
  // Orange case → tangerine headline matching the case material → art images.
  // Title, case, and screen content all swap together so the device and the
  // message read as one visual idea. Held longer than the earn slot so the
  // art images get enough time to play through their sweep cycles.
  {
    lines: ['Play with art', 'that moves you.'],
    caseImg: iphoneBackOrangeImg,
    color: '#FF7A1F',
    category: 'play',
    holdMs: 12000,
  },
];
const TITLE_TRANSITION_S = 1.6;
// Shared easing for the title swap (h1 text + chromatic shadow + phone-case
// crossfade). Material's [0.4, 0, 0.2, 1] is a soft asymmetric s-curve that
// gives a long, smooth handoff between the two titles — at 1.6s it reads as
// a gentle dissolve rather than the punchier glitch the original 0.9s gave.
const TITLE_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

// Touch/mobile detection — mobile Chrome can't keep up with the full layer stack
// (large blurred filters + many mix-blend-mode layers). On mobile we drop the
// heaviest pixel-fill layers and reduce blur radii. Evaluated once at module load;
// matches the device class, not the viewport size, so a desktop with a narrow
// window keeps the full visual.
//
// We use a UA check as the primary signal because some Android Chrome installs
// report `(hover: none) and (pointer: coarse)` as `false` (observed on a real
// device during diagnosis). The matchMedia query is kept as a fallback so the
// Chrome DevTools device-emulation toolbar also takes the mobile path.
const IS_TOUCH_DEVICE = (() => {
  if (typeof window === 'undefined') return false;
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const matchesCoarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  return isMobileUA || matchesCoarse;
})();

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
// "Earn" palette — the original Prism spectrum (violet ↔ mint ↔ blue) that
// pairs with the white case.
const EARN_CYCLE_A = ['#BC13FE', '#FF5AC8', '#00FFC2', '#4678FF', '#7D3CFF'];
const EARN_CYCLE_B = ['#00FFC2', '#4678FF', '#FF5AC8', '#9A4DFF', '#00FFC2'];
// "Play" palette — iPhone 17 Cosmic Orange spectrum (tangerine → peach →
// amber → sienna → coral). Pairs with the orange case so the whole page reads
// as one warm orange organism while the entertaining title is on screen.
const PLAY_CYCLE_A = ['#FF7A1F', '#FFB380', '#FF5A1A', '#FF9054', '#FF6B1F'];
const PLAY_CYCLE_B = ['#E04E1A', '#FFAA40', '#FF8C42', '#D9531A', '#FF7A1F'];
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

function ThemeColorProvider({
  category,
  children,
}: {
  category: SampleCategory;
  children: React.ReactNode;
}) {
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
        next = Math.floor(Math.random() * COLOR_CYCLE_KEYS.length);
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

  // The palette swaps when the page's title category changes (earn → play).
  // The new palette takes effect on the next render — visually, the color
  // transition lands during the title's chromatic-glitch swap, which masks
  // the discontinuity. Phase keeps ticking so motion stays continuous.
  const cycleA = category === 'play' ? PLAY_CYCLE_A : EARN_CYCLE_A;
  const cycleB = category === 'play' ? PLAY_CYCLE_B : EARN_CYCLE_B;
  const colorA = useTransform(phase, COLOR_CYCLE_KEYS, cycleA);
  const colorB = useTransform(phase, COLOR_CYCLE_KEYS, cycleB);
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
  theme: OnboardingTheme;
}

export function StepWelcome({ onStart, onSkip, theme }: StepWelcomeProps) {
  // titleIdx is owned here (not in StepWelcomeInner) so ThemeColorProvider —
  // which wraps the inner — can read the current category and pick the
  // matching palette (earn → Prism violet/mint, play → orange spectrum).
  const [titleIdx, setTitleIdx] = useState(0);
  useEffect(() => {
    // setTimeout (not setInterval) so each title can hold for its own duration:
    // the effect re-runs whenever titleIdx changes and reads holdMs from the
    // newly-active title. We round the hold up to the next e-ink slot boundary
    // (multiples of SLOT_SECONDS) so the title swap never lands mid-sweep —
    // the outgoing image always gets to finish revealing before the category
    // switch remounts the screen.
    const slotMs = SLOT_SECONDS * 1000;
    const heldMs = Math.ceil(TITLES[titleIdx].holdMs / slotMs) * slotMs;
    const t = setTimeout(() => {
      setTitleIdx((i) => (i + 1) % TITLES.length);
    }, heldMs);
    return () => clearTimeout(t);
  }, [titleIdx]);

  return (
    <ThemeColorProvider category={TITLES[titleIdx].category}>
      <StepWelcomeInner titleIdx={titleIdx} onStart={onStart} onSkip={onSkip} theme={theme} />
    </ThemeColorProvider>
  );
}

function StepWelcomeInner({
  titleIdx,
  onStart,
  onSkip,
  theme,
}: StepWelcomeProps & { titleIdx: number }) {
  const { gradient } = useThemeColors();
  const tokens = getOnboardingTokens(theme);
  const isDark = theme === 'dark';
  // In light mode the headline glitch shadows (red+cyan chromatic split) would
  // wash out on white. The orange "Play" title also needs darker contrast.
  const titleColorOverride = !isDark
    ? (TITLES[titleIdx].category === 'play' ? '#C0421A' : '#1A1A1A')
    : TITLES[titleIdx].color;
  const subtitleColor = isDark ? 'rgba(255,255,255,0.82)' : 'rgba(26,26,26,0.78)';
  const subtitleShadow = isDark
    ? '0 0 12px rgba(0,255,194,0.28), 0 1px 0 rgba(0,0,0,0.4)'
    : '0 0 8px rgba(0,255,194,0.16)';
  const skipColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(26,26,26,0.55)';

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ isolation: 'isolate', background: tokens.bg }}
    >
      <AnimatedBackdrop theme={theme} />

      {/* Full-bleed hero device */}
      <PhoneCaseScene titleIdx={titleIdx} />

      {/* Bottom legibility scrim — fades the device into a clean plate for the text */}
      <div
        className="absolute inset-x-0 bottom-0 h-[58%] pointer-events-none z-[5]"
        style={{ background: tokens.bottomScrim }}
      />

      {/* Text + CTAs overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-8 pb-10 pt-6 space-y-6">
        <div className="text-center space-y-3">
          <RotatingTitle idx={titleIdx} colorOverride={titleColorOverride} />
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[11px] font-semibold uppercase"
            style={{
              letterSpacing: '0.42em',
              paddingLeft: '0.42em',
              color: subtitleColor,
              textShadow: subtitleShadow,
            }}
          >
            Cast <span style={{ color: isDark ? 'rgba(0,255,194,0.85)' : '#00B589' }}>·</span> Earn{' '}
            <span style={{ color: isDark ? 'rgba(188,19,254,0.85)' : '#7A0FA8' }}>·</span> Play
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
            className="w-full h-10 text-sm font-medium transition-colors"
            style={{ color: skipColor }}
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function RotatingTitle({ idx, colorOverride }: { idx: number; colorOverride?: string }) {
  // Headline cycles through TITLES with a glitch-scratch transition between each.
  // The h1 is absolutely positioned inside a fixed-height relative wrapper so the
  // enter/exit animation can overlap without shifting the layout below. The
  // `idx` is owned by `StepWelcomeInner` so this title and the phone-case
  // crossfade swap in lockstep.
  const { lines: [lineA, lineB], color: defaultColor } = TITLES[idx];
  const color = colorOverride ?? defaultColor;

  return (
    // Fixed height matches `text-[30px]` × leading-[1.1] × 2 lines ≈ 66px. We
    // pin it explicitly so AnimatePresence swaps don't reflow the BG scrim
    // and the subtitle/CTA stack below.
    <div className="relative" style={{ height: 66 }}>
      <AnimatePresence mode="popLayout">
        <motion.h1
          key={idx}
          // Chromatic-aberration glitch: text-shadow renders a red-shift left and
          // a cyan-shift right of the glyphs. The shadows spread wide on entry,
          // settle to zero while held, then spread wide again on exit — like a
          // CRT scan misregistering during a refresh.
          initial={{
            opacity: 0,
            textShadow:
              '-6px 0 0 rgba(255,40,80,0.95), 6px 0 0 rgba(40,220,255,0.95)',
          }}
          animate={{
            opacity: 1,
            textShadow:
              '0px 0 0 rgba(255,40,80,0), 0px 0 0 rgba(40,220,255,0)',
          }}
          exit={{
            opacity: 0,
            textShadow:
              '-8px 0 0 rgba(255,40,80,0.95), 8px 0 0 rgba(40,220,255,0.95)',
          }}
          transition={{ duration: TITLE_TRANSITION_S, ease: TITLE_EASE }}
          className="absolute inset-0 text-[30px] leading-[1.1] font-semibold"
          style={{ color }}
        >
          {lineA}
          <br />
          {lineB}
        </motion.h1>
      </AnimatePresence>

      {/* Horizontal scratch streaks that flash across the title during each
          swap. Keyed by idx so they remount and replay on every change. */}
      <TitleGlitchScratches key={`title-scratch-${idx}`} duration={TITLE_TRANSITION_S} />
    </div>
  );
}

function TitleGlitchScratches({ duration }: { duration: number }) {
  // Brief bright streaks that flash across the title region during a transition.
  // Same visual language as the E-ink screen's GlitchScratches but scaled down
  // to title height. Timings are expressed as fractions of the title-swap
  // duration so they stay in sync if TITLE_TRANSITION_S changes.
  const scratches = [
    { delayFrac: 0.05, top: 0.18, height: 1.5, color: '#00FFC2', durFrac: 0.30, xJitter: -10 },
    { delayFrac: 0.22, top: 0.48, height: 2, color: '#BC13FE', durFrac: 0.25, xJitter: 12 },
    { delayFrac: 0.40, top: 0.78, height: 1, color: '#FFFFFF', durFrac: 0.22, xJitter: -8 },
    { delayFrac: 0.58, top: 0.32, height: 1, color: '#FF5AC8', durFrac: 0.18, xJitter: 8 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {scratches.map((s, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: `${s.top * 100}%`,
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
            duration: duration * s.durFrac,
            delay: duration * s.delayFrac,
            times: [0, 0.35, 1],
            ease: 'easeOut',
          }}
        />
      ))}
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
  const allOrbs = [
    { size: 220, color: 'rgba(0,255,194,0.50)', left: '12%', top: '20%', dur: 36, dx: 30, dy: 22 },
    { size: 180, color: 'rgba(188,19,254,0.55)', left: '74%', top: '30%', dur: 42, dx: -28, dy: 18 },
    { size: 260, color: 'rgba(0,255,194,0.40)', left: '60%', top: '70%', dur: 48, dx: -22, dy: -32 },
    { size: 150, color: 'rgba(255,90,200,0.50)', left: '22%', top: '78%', dur: 38, dx: 24, dy: -26 },
    { size: 140, color: 'rgba(70,180,255,0.50)', left: '85%', top: '60%', dur: 50, dx: -18, dy: 28 },
    { size: 110, color: 'rgba(255,255,255,0.35)', left: '40%', top: '15%', dur: 44, dx: 20, dy: 14 },
  ];
  // On touch devices keep only the three biggest/most-distinct orbs — each orb is a
  // blurred screen-blend layer, and the per-frame fill cost adds up fast on mobile.
  const orbs = IS_TOUCH_DEVICE ? [allOrbs[0], allOrbs[1], allOrbs[2]] : allOrbs;
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

function AnimatedBackdrop({ theme }: { theme: OnboardingTheme }) {
  const isDark = theme === 'dark';
  // The silk/orbs/ribbon scene was tuned for `mix-blend-mode: screen` over a
  // near-black base — bright colors brighten further. On a white base, screen
  // pushes most pixels to pure white, so the scene vanishes. For light mode we
  // wrap the whole composition in a single `mix-blend-mode: multiply` layer:
  // the inner screen-blends still composite against the wrapper's own buffer
  // (which is dark-ish where the colors land), and the final multiply paints
  // those colored regions down onto the white page, producing the same hue
  // motion as a soft watercolor wash.
  const wrapperBlend = isDark ? ('normal' as const) : ('multiply' as const);
  const wrapperOpacity = isDark ? 1 : 0.55;
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
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      // Self-contained stacking context: the four ribbons, the orbs, and the
      // rotating conic all blend against each other here, not against the page.
      // `translateZ(0)` promotes this subtree to its own compositor layer so
      // mobile Chrome can keep the blend buffer stable across frames.
      // `mixBlendMode: multiply` only kicks in for light mode (see comment
      // above) — in dark mode it stays at 'normal' so the original visuals
      // composite unchanged.
      style={{
        isolation: 'isolate',
        transform: 'translateZ(0)',
        mixBlendMode: wrapperBlend,
        opacity: wrapperOpacity,
      }}
    >
      {/* Deep base wash — only needed in dark mode; in light mode a deep
          violet/teal wash would multiply down to muddy plum across the page. */}
      {isDark && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(40,10,60,0.55) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(0,60,55,0.5) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Ribbons: desktop gets the full four-ribbon parallax stack; touch
          devices get a single CSS-animated silk-flow layer (`MobileSilkFlow`
          below). Bisecting on a real Android Chrome confirmed the original
          stack — four 300%-wide blurred screen-blend surfaces each animating
          x continuously — exceeds mobile GPU fill budget and causes the page
          composite to drop in and out (the "flashing"). */}
      {IS_TOUCH_DEVICE && <MobileSilkFlow />}
      {!IS_TOUCH_DEVICE && ribbons.map((r, i) => (
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

      {/* Stronger edge vignette — corners darken in dark mode, but for light mode
          a black vignette would multiply onto white and turn the edges grey, so
          we skip it entirely (the page bg + scrim handle legibility there). */}
      {isDark && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(0,0,0,0.55) 100%)',
          }}
        />
      )}

      {/* Silk shimmer — soft cross-cutting highlight that breathes for "fabric" feel.
          Skipped on touch devices: full-viewport screen-blend layer animating x/opacity
          adds another per-frame composite pass we don't need on phones. */}
      {!IS_TOUCH_DEVICE && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(110deg, transparent 0%, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%, transparent 100%)',
            mixBlendMode: 'screen',
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
          }}
          animate={{ x: ['-30%', '30%', '-30%'], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Slow rotating conic — keeps the palette shifting under the ribbons.
          Skipped on touch devices: a 40px-blurred full-viewport surface that
          rotates every frame is the heaviest single layer in this scene, and
          mobile compositors can't keep up with it. */}
      {!IS_TOUCH_DEVICE && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, rgba(0,255,194,0.10) 0deg, transparent 90deg, rgba(188,19,254,0.10) 180deg, transparent 270deg, rgba(0,255,194,0.10) 360deg)',
            filter: 'blur(40px)',
            mixBlendMode: 'screen',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
        />
      )}

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

function PhoneCaseScene({ titleIdx }: { titleIdx: number }) {
  // Source asset: 360px-wide reference with E-ink screen overlay at top:222 left:99 w:168 h:250.
  // We scale to 520px so the device runs nearly edge-to-edge (design width is 448px),
  // letting the phone bleed past the viewport edges for an immersive hero. Both
  // case PNGs (white + orange) share the same 862×1248 source dimensions, so the
  // screen overlay coordinates are valid for either.
  const W = 520;
  const F = W / 360;
  const screen = {
    top: 222 * F,
    left: 99 * F,
    width: 168 * F,
    height: 250 * F,
    radius: 7 * F,
  };

  const activeCase = TITLES[titleIdx].caseImg;

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
        // On touch devices use a single shadow: three stacked drop-shadow() passes
        // means three full-image filter rasterizations every composite, which mobile
        // GPUs struggle with when the scene is already filter-heavy.
        filter: IS_TOUCH_DEVICE
          ? 'drop-shadow(0 16px 32px rgba(0,0,0,0.6))'
          : 'drop-shadow(0 8px 16px rgba(0,0,0,0.55)) drop-shadow(0 48px 90px rgba(188,19,254,0.42)) drop-shadow(0 20px 40px rgba(0,255,194,0.22))',
      }}
    >
      <div className="relative">
        {/* Invisible layout-holder: a non-rendering copy of the case image so the
            container takes the right size. The visible crossfading copies are
            absolutely positioned over it. */}
        <img
          src={iphoneBackWhiteImg}
          aria-hidden
          className="w-full h-auto object-contain select-none invisible"
          draggable={false}
        />
        <AnimatePresence>
          <motion.img
            key={titleIdx}
            src={activeCase}
            alt="AdPal Device"
            className="absolute inset-0 w-full h-auto object-contain select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TITLE_TRANSITION_S, ease: TITLE_EASE }}
            draggable={false}
          />
        </AnimatePresence>

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
            // Contain the inner `mix-blend-mode: color` washes + sweep band so
            // they composite within the screen, not against the phone case.
            isolation: 'isolate',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* E-ink screen content is keyed by category so that switching from
              "earn" to "play" remounts the reveal cycle and the screen visibly
              jumps into the new image set from photo 0. */}
          <EinkSweepReveal
            key={TITLES[titleIdx].category}
            screenHeight={screen.height}
            category={TITLES[titleIdx].category}
          />

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

function EinkSweepReveal({
  screenHeight,
  category,
}: {
  screenHeight: number;
  category: SampleCategory;
}) {
  // E-ink-style refresh: the previous image sits as the static backdrop. A new image is
  // revealed top-down in perfect lockstep with the sweep bar — at sweep position 35%,
  // the top 35% of the new image is visible; the bottom 65% still shows the previous.
  // After the sweep completes, the new image becomes the backdrop and the cycle repeats.
  const categoryPhotos = samplePhotosByCategory[category];
  const photos = categoryPhotos.slice(0, Math.min(5, categoryPhotos.length));
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

function MobileSilkFlow() {
  // Single-layer silk-river replacement for touch devices. One painted gradient,
  // 200% wide background panned via a CSS `background-position` keyframe — runs on
  // the compositor thread on Chrome/WebKit and avoids the four-layer blurred
  // screen-blend stack that overflowed mobile GPU fill budget. `willChange` and
  // `translateZ(0)` force the layer onto the compositor so the animation can run
  // independently of the main thread.
  return (
    <>
      <style>{`
        @keyframes silk-flow-touch {
          0%   { background-position:   0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          // Five color peaks matching the four desktop ribbons (violet, mint,
          // pink, blue) plus a return-violet so the loop seam is invisible.
          // Opacity matches the original ribbons (0.75–0.9) for full silk feel.
          background:
            'linear-gradient(110deg,' +
            ' transparent 0%,' +
            ' rgba(188,19,254,0.88) 9%,' +
            ' transparent 20%,' +
            ' rgba(0,255,194,0.85) 32%,' +
            ' transparent 44%,' +
            ' rgba(255,90,200,0.75) 56%,' +
            ' transparent 68%,' +
            ' rgba(70,120,255,0.8) 80%,' +
            ' transparent 91%,' +
            ' rgba(188,19,254,0.6) 100%)',
          // 300% pan distance = the gradient travels twice as far per cycle as
          // a 200% pan would, so peaks visibly enter from one side and exit the
          // other (river-of-light feel rather than a subtle hue shift).
          backgroundSize: '300% 100%',
          filter: 'blur(28px)',
          mixBlendMode: 'screen',
          animation: 'silk-flow-touch 18s linear infinite',
          willChange: 'background-position',
          transform: 'translateZ(0)',
          opacity: 0.95,
        }}
      />
    </>
  );
}
