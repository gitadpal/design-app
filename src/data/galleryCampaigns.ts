import type { ChainId } from '../components/CampaignGallery/chainColors';

// One frame of an animated series. The user picks a single frame to commit;
// each frame can carry its own payout + rarity so the user has reason to scrub.
export interface CampaignFrame {
  image: string;
  tokensPerCast: number;
  rarity?: 'common' | 'rare' | 'epic';
}

export interface GalleryCampaign {
  id: number;
  title: string;
  advertiser: string;
  description: string;
  image: string;
  chain: ChainId;
  tokenSymbol: string;
  tokensPerCast: number;
  durationHours: number;
  edition: number;
  totalEdition: number;
  // Percent of the token pool still claimable (0..100). Drives the card's
  // progress bar — high values read as "fresh, room to earn", low values as
  // "almost out, FOMO". Pool size itself is derived from totalEdition ×
  // tokensPerCast in the detail view.
  poolRemaining: number;
  trending?: boolean;
  // Campaign window (ISO date) — surfaced as "ends MMM D · N days left" in
  // the detail view. Sourced from the poster.md sample sheet.
  startDate?: string;
  endDate?: string;
  // When present, the card is a multi-frame series — auto-plays in the
  // spotlight zone, opens to a scrub view, and the user commits one frame.
  frames?: CampaignFrame[];
}

// Helper: derive frames for a series from a list of [imageUrl, payoutDelta]
// tuples. payoutDelta is added to the base payout so a series has a payout arc
// (the scrub-view sparkline can show this as a curve to aim for).
export function makeFrames(
  base: { image: string; tokensPerCast: number },
  variants: Array<{ image: string; payoutDelta?: number; rarity?: CampaignFrame['rarity'] }>,
): CampaignFrame[] {
  return variants.map((v) => ({
    image: v.image,
    tokensPerCast: base.tokensPerCast + (v.payoutDelta ?? 0),
    rarity: v.rarity ?? 'common',
  }));
}

// Posters live in /public/poster — referenced by absolute URL so Vite serves
// them as static assets (no per-image import needed for a sample batch).
const POSTER = (file: string) => `/poster/${file}`;

// Mock batch sourced from gallery/poster/poster.md. Each entry pairs a poster
// image with its USDC payout, chain, pool size, and campaign window. Pool
// size is split into tokensPerCast × totalEdition so the wall and detail
// view derive consistent remaining/totals.
export const GALLERY_CAMPAIGNS: GalleryCampaign[] = [
  {
    id: 1,
    title: 'Pay in a Loop',
    advertiser: 'Loop Pay',
    description: 'Gasless USDC checkout for creators.',
    image: POSTER('payinaloop.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.30,
    durationHours: 4,
    edition: 312,
    totalEdition: 25000,
    poolRemaining: 71,
    startDate: '2026-06-15',
    endDate: '2026-07-15',
  },
  {
    id: 2,
    title: 'Tap With USDC',
    advertiser: 'Circle',
    description: 'Stablecoin checkout, made visible.',
    image: POSTER('tapwithusdc.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.20,
    durationHours: 3,
    edition: 1842,
    totalEdition: 50000,
    poolRemaining: 84,
    startDate: '2026-06-15',
    endDate: '2026-07-15',
    trending: true,
  },
  {
    id: 3,
    title: 'Swap From Anywhere',
    advertiser: 'Uniswap',
    description: 'DeFi, visible in the wild.',
    image: POSTER('swapfromanywher.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.50,
    durationHours: 6,
    edition: 218,
    totalEdition: 50000,
    poolRemaining: 58,
    startDate: '2026-06-17',
    endDate: '2026-07-31',
  },
  {
    id: 4,
    title: 'Your Ticket Lives Onchain',
    advertiser: 'Onchain Tickets',
    description: 'Show up, tap in, belong.',
    image: POSTER('yourticketlivesonchain.jpg'),
    chain: 'polygon',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.20,
    durationHours: 3,
    edition: 504,
    totalEdition: 20000,
    poolRemaining: 22,
    startDate: '2026-07-01',
    endDate: '2026-08-15',
    trending: true,
  },
  {
    id: 5,
    title: 'Spend Onchain Anywhere',
    advertiser: 'Coinbase',
    description: 'Turn everyday payments into rewards.',
    image: POSTER('spendonchainanywhere.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.35,
    durationHours: 5,
    edition: 87,
    totalEdition: 21429,
    poolRemaining: 76,
    startDate: '2026-06-15',
    endDate: '2026-07-31',
  },
  {
    id: 6,
    title: 'Unfold More',
    advertiser: 'Samsung',
    description: 'A bigger iPhone moment.',
    image: POSTER('unfoldmore.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.50,
    durationHours: 8,
    edition: 41,
    totalEdition: 500000,
    poolRemaining: 92,
    startDate: '2026-09-09',
    endDate: '2026-10-09',
    trending: true,
  },
  {
    id: 7,
    title: 'Your Nail, Live',
    advertiser: 'Glowna',
    description: 'Tiny display, endless style.',
    image: POSTER('yournaillive.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.28,
    durationHours: 4,
    edition: 612,
    totalEdition: 78571,
    poolRemaining: 47,
    startDate: '2026-07-18',
    endDate: '2026-08-30',
  },
  {
    id: 8,
    title: 'Fly First Person',
    advertiser: 'DJI',
    description: 'Cinematic flight in your hands.',
    image: POSTER('flyfirstperson.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.32,
    durationHours: 5,
    edition: 233,
    totalEdition: 93750,
    poolRemaining: 64,
    startDate: '2026-08-05',
    endDate: '2026-09-10',
  },
  {
    id: 9,
    title: 'Print Tomorrow',
    advertiser: 'Bambu Lab',
    description: 'Ideas become real fast.',
    image: POSTER('printtomorrow.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.35,
    durationHours: 5,
    edition: 119,
    totalEdition: 71429,
    poolRemaining: 81,
    startDate: '2026-07-08',
    endDate: '2026-08-22',
  },
  {
    id: 10,
    title: 'North London Reigns',
    advertiser: 'Arsenal FC',
    description: 'Champions in red and white.',
    image: POSTER('northlondonreigns.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.40,
    durationHours: 6,
    edition: 2864,
    totalEdition: 250000,
    poolRemaining: 38,
    startDate: '2026-06-10',
    endDate: '2026-07-20',
    trending: true,
  },
  {
    id: 11,
    title: 'Run the Night',
    advertiser: 'Nike',
    description: 'Built for city speed.',
    image: POSTER('runthenight.jpg'),
    chain: 'polygon',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.30,
    durationHours: 5,
    edition: 731,
    totalEdition: 150000,
    poolRemaining: 67,
    startDate: '2026-08-01',
    endDate: '2026-09-15',
  },
  {
    id: 12,
    title: 'Start Bright',
    advertiser: 'Starbucks',
    description: 'Coffee and breakfast made easy.',
    image: POSTER('startbright.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.20,
    durationHours: 3,
    edition: 4128,
    totalEdition: 175000,
    poolRemaining: 55,
    startDate: '2026-06-17',
    endDate: '2026-07-31',
  },
  {
    id: 13,
    title: 'Don’t Open It',
    advertiser: 'Bloober Team',
    description: 'Playable horror after midnight.',
    image: POSTER('dontopenit.jpg'),
    chain: 'arbitrum',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.22,
    durationHours: 4,
    edition: 96,
    totalEdition: 81818,
    poolRemaining: 88,
    startDate: '2026-09-13',
    endDate: '2026-10-31',
  },
  {
    id: 14,
    title: 'Enter Moonforge',
    advertiser: 'Moonforge Studios',
    description: 'A pixel world awakens.',
    image: POSTER('entermoonforge.jpg'),
    chain: 'polygon',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.18,
    durationHours: 3,
    edition: 287,
    totalEdition: 66667,
    poolRemaining: 73,
    startDate: '2026-06-24',
    endDate: '2026-07-24',
  },
  {
    id: 15,
    title: 'Heat in Hand',
    advertiser: 'Popeyes',
    description: 'Spicy chicken, louder cravings.',
    image: POSTER('heatinhand.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.25,
    durationHours: 4,
    edition: 1593,
    totalEdition: 200000,
    poolRemaining: 49,
    startDate: '2026-07-10',
    endDate: '2026-08-10',
  },
  {
    id: 16,
    title: 'Cold Brew Moves',
    advertiser: 'Blue Bottle Coffee',
    description: 'Fuel your city rhythm.',
    image: POSTER('coldbrewmoves.jpg'),
    chain: 'polygon',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.20,
    durationHours: 3,
    edition: 482,
    totalEdition: 100000,
    poolRemaining: 79,
    startDate: '2026-07-01',
    endDate: '2026-08-15',
  },
  {
    id: 17,
    title: 'Extreme Has Arrived',
    advertiser: 'Tesla',
    description: 'Electric speed, redefined.',
    image: POSTER('extremehasarrived.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.45,
    durationHours: 7,
    edition: 64,
    totalEdition: 266667,
    poolRemaining: 31,
    startDate: '2026-07-12',
    endDate: '2026-08-31',
    trending: true,
  },
  {
    id: 18,
    title: 'Help Has Hands',
    advertiser: 'TaskRabbit',
    description: 'Housework, handled at home.',
    image: POSTER('helphashands.jpg'),
    chain: 'base',
    tokenSymbol: 'USDC',
    tokensPerCast: 0.36,
    durationHours: 5,
    edition: 152,
    totalEdition: 111111,
    poolRemaining: 62,
    startDate: '2026-09-01',
    endDate: '2026-10-15',
  },
];

// Tokens-per-cast extremes across the batch — used to scale aura intensity so
// the relative payout reads at a glance.
export const PAYOUT_RANGE = (() => {
  const values = GALLERY_CAMPAIGNS.map((c) => c.tokensPerCast);
  return { min: Math.min(...values), max: Math.max(...values) };
})();
