// Circle accent tokens. Amber is distinct from the four other tab accents:
//   Earnings emerald #22c55e, Cast rose #f43f5e, Assets violet #BC13FE,
//   Settings cyan #06b6d4. Amber carries the "gift / value" warmth and
//   completes a warm→cool spectrum across the bottom nav.
export const CIRCLE_ACCENT = '#f59e0b';         // Tailwind amber-500
export const CIRCLE_ACCENT_STRONG = '#d97706';  // amber-600 for hovers / rings
export const CIRCLE_ACCENT_SOFT = 'rgba(245,158,11,0.20)';
export const CIRCLE_ACCENT_BADGE = '#fbbf24';   // amber-400 for badge dots
export const CIRCLE_INACTIVE_TEXT = 'text-amber-400';
export const CAST_MINT = '#00FFC2';

// Drops accent — the collectible economy is a Web3 surface, so it leans on the
// brand "Prism Gradient" (Cyber Mint → Electric Violet) for its CTAs and rarity
// flourishes, while still living under Circle's amber umbrella section-wise.
export const DROPS_MINT = '#00FFC2';
export const DROPS_VIOLET = '#BC13FE';
export const DROPS_PRISM = 'linear-gradient(135deg, #00FFC2, #BC13FE)';
export const DROPS_PRISM_SOFT = 'linear-gradient(135deg, rgba(0,255,194,0.16), rgba(188,19,254,0.16))';

// Aspect used across every Circle tile — matches the existing gallery.
export const CIRCLE_TILE_ASPECT = 'aspect-[5/7]';

// e-ink canvas aspect (portrait 528 × 768).
export const EINK_ASPECT_RATIO = 528 / 768;

export type CircleView =
  | 'main'
  | 'subscription-detail'
  | 'explore-subs'
  | 'add-friend'
  | 'friend-list'
  | 'tip-composer'
  | 'queue-browser'
  | 'settings'
  | 'friend-history';
