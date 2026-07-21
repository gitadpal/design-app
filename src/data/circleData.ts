// Mock data for the Circle feature — friends, subscriptions, sub-posts, gifts,
// and tokens available for tipping. Backend, transport, and delivery are out of
// scope for this pass; the UI treats these shapes as if they were populated by a
// real messaging + wallet layer.

export interface Friend {
  handle: string;          // `word-word#nnnn`, immutable
  avatarSeed: string;      // deterministic tint fallback
  avatarUrl: string;       // portrait photo used as tile background
  walletAddress: string;
  addedAt: string;         // ISO
  sentCount: number;
  receivedCount: number;
  hasNewGift?: boolean;
}

// Local clay-style character avatars shipped under public/avatar/. Files are
// zero-padded 3-digit (`avatar_001.png` … `avatar_032.png`); this helper pads
// the index. Friends draw from a scattered, non-sequential spread of the pool
// (not 1,2,3…) so the grid looks like a random assortment of portraits.
const avatar = (n: number) =>
  `${import.meta.env.BASE_URL}avatar/avatar_${String(n).padStart(3, '0')}.png`;

// Total portraits available under public/avatar/ (avatar_001…avatar_032).
export const AVATAR_POOL_SIZE = 32;

// Deterministic portrait for an arbitrary handle — used when adding a friend
// by handle, where we don't have their real avatar, so we pick a stable one
// from the pool by hashing the handle.
export const avatarForHandle = (handle: string): string => {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) | 0;
  return avatar((Math.abs(h) % AVATAR_POOL_SIZE) + 1);
};

export interface Subscription {
  creatorHandle: string;
  title: string;
  tagline?: string;
  coverSeed: string;
  tier: 'free' | 'paid';
  subscribedAt: string;
  unreadCount: number;
  postIds: string[];
  // Billing + management. Paid subs carry a price and a renewal date; autoRenew
  // and muted are user-managed from the Manage-subscription sheet.
  priceUsdc?: number;
  renewsAt?: string;
  autoRenew?: boolean;
  muted?: boolean;
  // false once unsubscribed. The sub stays in the library so already-received
  // posters remain viewable/castable; only new deliveries + billing stop.
  // Undefined is treated as active.
  active?: boolean;
}

export interface SubPost {
  id: string;
  creatorHandle: string;
  previewUrl: string;
  publishedAt: string;
  title?: string;
}

export interface Gift {
  id: string;
  // Every gift is a directed transfer between two handles. In the mock, one
  // side is always CIRCLE_ME — the direction the UI shows depends on which
  // side matches. Display name is resolved at render time via the remarks
  // store (per-user remark) — never snapshotted on the gift itself.
  fromHandle: string;
  toHandle: string;
  previewUrl: string;
  // Crypto is optional — a gift can be just the image. When any of these are
  // set they're all set (see the tip composer's "attach crypto" toggle).
  tokenSymbol?: string;
  tokenAmount?: string;
  chain?: string;
  note?: string;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
}

export type QueueSource = 'gift' | 'sub';
export interface QueueItem {
  key: string;
  source: QueueSource;
  arrivedAt: string;
  refId: string;
}

export interface TipToken {
  symbol: string;
  name: string;
  chain: string;
  balance: number;
  usdRate: number;
}

const galleryAsset = (filename: string) => `${import.meta.env.BASE_URL}gallery/${filename}`;

export const CIRCLE_ME = {
  handle: 'fern-quill#4821',
  walletAddress: '0x7a2e5B94c1F02b1c9A5c0d3e8fA9B4d2E7A0c93b',
  chain: 'base',
};

// Sample gallery images used when composing a gift — a random one stands in for
// "picked from Assets". All portrait e-ink art already shipped under
// public/gallery/.
export const SAMPLE_GALLERY_IMAGES: string[] = [
  'animal_orange_tabby_kitten.png',
  'landscape_red_autumn_bridge.png',
  'animal_red_shiba_puppy.png',
  'landscape_amber_hot_balloons.png',
  'city_cream_paris_landmarks.png',
  'chinese_gold_pagoda_clouds.png',
  'landscape_pink_snowy_village.png',
  'animal_white_snowy_owl.png',
  'landscape_amber_harvest_moon.png',
  'chinese_red_lantern_alley.png',
].map(galleryAsset);

export const randomGalleryImage = (exclude?: string): string => {
  const pool = exclude
    ? SAMPLE_GALLERY_IMAGES.filter((u) => u !== exclude)
    : SAMPLE_GALLERY_IMAGES;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const CIRCLE_FRIENDS: Friend[] = [
  { handle: 'moss-harbor#9182',   avatarSeed: 'moss',    avatarUrl: avatar(7),  walletAddress: '0x812a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a11', addedAt: '2026-05-01T09:12:00Z', sentCount: 3, receivedCount: 0 },
  { handle: 'river-lens#2044',    avatarSeed: 'river',   avatarUrl: avatar(22), walletAddress: '0x912a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a12', addedAt: '2026-05-14T14:02:00Z', sentCount: 0, receivedCount: 1 },
  { handle: 'petal-dune#5563',    avatarSeed: 'petal',   avatarUrl: avatar(3),  walletAddress: '0xa12a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a13', addedAt: '2026-06-02T18:44:00Z', sentCount: 2, receivedCount: 4, hasNewGift: true },
  { handle: 'amber-loop#6620',    avatarSeed: 'amber',   avatarUrl: avatar(15), walletAddress: '0xb12a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a14', addedAt: '2026-06-19T08:20:00Z', sentCount: 1, receivedCount: 1 },
  { handle: 'sable-branch#3011',  avatarSeed: 'sable',   avatarUrl: avatar(28), walletAddress: '0xc12a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a15', addedAt: '2026-07-01T10:04:00Z', sentCount: 0, receivedCount: 0 },
  { handle: 'linen-tide#4477',    avatarSeed: 'linen',   avatarUrl: avatar(11), walletAddress: '0xd12a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a16', addedAt: '2026-07-08T21:15:00Z', sentCount: 5, receivedCount: 2 },
  { handle: 'ember-loft#0808',    avatarSeed: 'ember',   avatarUrl: avatar(1),  walletAddress: '0xe12a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a17', addedAt: '2026-07-13T12:00:00Z', sentCount: 0, receivedCount: 3 },
  { handle: 'kestrel-mote#7133',  avatarSeed: 'kestrel', avatarUrl: avatar(19), walletAddress: '0xf12a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a18', addedAt: '2026-07-14T09:00:00Z', sentCount: 0, receivedCount: 0 },
  { handle: 'quiet-fern#1902',    avatarSeed: 'quiet',   avatarUrl: avatar(31), walletAddress: '0x212a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a19', addedAt: '2026-07-14T13:20:00Z', sentCount: 2, receivedCount: 0 },
  { handle: 'brass-hare#5540',    avatarSeed: 'brass',   avatarUrl: avatar(9),  walletAddress: '0x312a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a20', addedAt: '2026-07-15T07:40:00Z', sentCount: 0, receivedCount: 2 },
  { handle: 'copper-vine#8890',   avatarSeed: 'copper',  avatarUrl: avatar(25), walletAddress: '0x412a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a21', addedAt: '2026-07-15T18:00:00Z', sentCount: 4, receivedCount: 4 },
  { handle: 'dust-otter#0022',    avatarSeed: 'dust',    avatarUrl: avatar(5),  walletAddress: '0x512a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a22', addedAt: '2026-07-15T23:10:00Z', sentCount: 0, receivedCount: 1, hasNewGift: true },
  { handle: 'iron-thistle#3355',  avatarSeed: 'iron',    avatarUrl: avatar(17), walletAddress: '0x612a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a23', addedAt: '2026-07-16T02:45:00Z', sentCount: 1, receivedCount: 0 },
  { handle: 'jade-eaves#7788',    avatarSeed: 'jade',    avatarUrl: avatar(13), walletAddress: '0x712a11cB4a2a1a1a1a1a1a1a1a1a1a1a1a1a1a24', addedAt: '2026-07-16T04:15:00Z', sentCount: 0, receivedCount: 0 },
];

// Weather sub — one poster per day, chronological. Posters live under
// public/sub/weather/ and follow `weather_hk_YYYYMMDD.png`.
const weatherPoster = (yyyymmdd: string) =>
  `${import.meta.env.BASE_URL}sub/weather/weather_hk_${yyyymmdd}.png`;

// Fortune-quill sub — divination posters under public/sub/fortunetelling/.
// Filenames are date-stamped (`telling-YYYYMMDD.png`); mapped newest→oldest
// so fortunePoster(1) is the most recent card.
const FORTUNE_POSTERS = ['20260726', '20260725', '20260724', '20260723', '20260722', '20260721'];
const fortunePoster = (n: number) =>
  `${import.meta.env.BASE_URL}sub/fortunetelling/telling-${FORTUNE_POSTERS[(n - 1) % FORTUNE_POSTERS.length]}.png`;

export const CIRCLE_SUB_POSTS: SubPost[] = [
  { id: 'p1', creatorHandle: 'fortune-quill#0733', previewUrl: fortunePoster(1), publishedAt: '2026-07-16T05:30:00Z', title: 'Wheel · Dawn' },
  { id: 'p2', creatorHandle: 'fortune-quill#0733', previewUrl: fortunePoster(2), publishedAt: '2026-07-15T05:30:00Z', title: 'Vessel' },
  { id: 'p3', creatorHandle: 'fortune-quill#0733', previewUrl: fortunePoster(3), publishedAt: '2026-07-14T05:30:00Z', title: 'Alley' },
  { id: 'p4', creatorHandle: 'fortune-quill#0733', previewUrl: fortunePoster(4), publishedAt: '2026-07-13T05:30:00Z', title: 'Peak' },
  { id: 'p5', creatorHandle: 'fortune-quill#0733', previewUrl: fortunePoster(5), publishedAt: '2026-07-12T05:30:00Z', title: 'Dusk' },
  { id: 'p6', creatorHandle: 'fortune-quill#0733', previewUrl: fortunePoster(6), publishedAt: '2026-07-11T05:30:00Z', title: 'Rooftop' },
  // Weather sub — 7-day HK forecast posters, newest-first
  { id: 'wt7', creatorHandle: 'weather-brief#0011', previewUrl: weatherPoster('20260725'), publishedAt: '2026-07-25T06:00:00Z', title: 'Fri · Jul 25' },
  { id: 'wt6', creatorHandle: 'weather-brief#0011', previewUrl: weatherPoster('20260724'), publishedAt: '2026-07-24T06:00:00Z', title: 'Thu · Jul 24' },
  { id: 'wt5', creatorHandle: 'weather-brief#0011', previewUrl: weatherPoster('20260723'), publishedAt: '2026-07-23T06:00:00Z', title: 'Wed · Jul 23' },
  { id: 'wt4', creatorHandle: 'weather-brief#0011', previewUrl: weatherPoster('20260722'), publishedAt: '2026-07-22T06:00:00Z', title: 'Tue · Jul 22' },
  { id: 'wt3', creatorHandle: 'weather-brief#0011', previewUrl: weatherPoster('20260721'), publishedAt: '2026-07-21T06:00:00Z', title: 'Mon · Jul 21' },
  { id: 'wt2', creatorHandle: 'weather-brief#0011', previewUrl: weatherPoster('20260720'), publishedAt: '2026-07-20T06:00:00Z', title: 'Sun · Jul 20' },
  { id: 'wt1', creatorHandle: 'weather-brief#0011', previewUrl: weatherPoster('20260719'), publishedAt: '2026-07-19T06:00:00Z', title: 'Sat · Jul 19' },

  // Posters for the discoverable catalog creators (see CIRCLE_SUB_CATALOG). They
  // only surface once the creator is subscribed, since every reader iterates the
  // subs list — so seeding them here is inert until then.
  { id: 'sw1', creatorHandle: 'still-water#0455', previewUrl: galleryAsset('landscape_pink_snowy_village.png'), publishedAt: '2026-07-16T05:45:00Z', title: 'First light' },
  { id: 'sw2', creatorHandle: 'still-water#0455', previewUrl: galleryAsset('landscape_red_autumn_bridge.png'),  publishedAt: '2026-07-15T05:45:00Z', title: 'Crossing' },
  { id: 'sw3', creatorHandle: 'still-water#0455', previewUrl: galleryAsset('landscape_red_maple_child.png'),    publishedAt: '2026-07-14T05:45:00Z', title: 'Small hours' },

  { id: 'tz1', creatorHandle: 'tiny-zoo#0288', previewUrl: galleryAsset('animal_orange_tabby_kitten.png'), publishedAt: '2026-07-16T08:00:00Z', title: 'Tabby' },
  { id: 'tz2', creatorHandle: 'tiny-zoo#0288', previewUrl: galleryAsset('animal_red_shiba_puppy.png'),     publishedAt: '2026-07-15T08:00:00Z', title: 'Shiba' },
  { id: 'tz3', creatorHandle: 'tiny-zoo#0288', previewUrl: galleryAsset('animal_white_panda_cub.png'),     publishedAt: '2026-07-14T08:00:00Z', title: 'Panda cub' },

  { id: 'mp1', creatorHandle: 'market-pulse#0912', previewUrl: galleryAsset('city_cream_paris_landmarks.png'),   publishedAt: '2026-07-16T06:30:00Z', title: 'Open · Jul 16' },
  { id: 'mp2', creatorHandle: 'market-pulse#0912', previewUrl: galleryAsset('city_gold_shanghai_landmarks.png'), publishedAt: '2026-07-15T06:30:00Z', title: 'Open · Jul 15' },
  { id: 'mp3', creatorHandle: 'market-pulse#0912', previewUrl: galleryAsset('city_orange_beijing_landmarks.png'),publishedAt: '2026-07-14T06:30:00Z', title: 'Open · Jul 14' },

  { id: 'lp1', creatorHandle: 'lunar-press#0621', previewUrl: galleryAsset('landscape_amber_harvest_moon.png'), publishedAt: '2026-07-16T21:00:00Z', title: 'Waxing gibbous' },
  { id: 'lp2', creatorHandle: 'lunar-press#0621', previewUrl: galleryAsset('chinese_gold_pagoda_clouds.png'),   publishedAt: '2026-07-15T21:00:00Z', title: 'First quarter' },
  { id: 'lp3', creatorHandle: 'lunar-press#0621', previewUrl: galleryAsset('chinese_red_lantern_alley.png'),    publishedAt: '2026-07-14T21:00:00Z', title: 'Crescent' },
];

// Discoverable creators the user can subscribe to from the Explore screen. Not
// part of the initial library (CIRCLE_SUBS) — subscribing copies one of these
// into the subs store. Their posters live in CIRCLE_SUB_POSTS above.
export const CIRCLE_SUB_CATALOG: Subscription[] = [
  {
    creatorHandle: 'still-water#0455',
    title: 'still-water',
    tagline: 'A quiet frame at first light. Breathe, then begin.',
    coverSeed: 'stillwater',
    tier: 'free',
    subscribedAt: '',
    unreadCount: 0,
    postIds: ['sw1', 'sw2', 'sw3'],
  },
  {
    creatorHandle: 'tiny-zoo#0288',
    title: 'tiny-zoo',
    tagline: "One small creature a day. That's the whole newsletter.",
    coverSeed: 'tinyzoo',
    tier: 'free',
    subscribedAt: '',
    unreadCount: 0,
    postIds: ['tz1', 'tz2', 'tz3'],
  },
  {
    creatorHandle: 'market-pulse#0912',
    title: 'market-pulse',
    tagline: 'Markets at dawn, one poster. Numbers you can glance.',
    coverSeed: 'marketpulse',
    tier: 'paid',
    priceUsdc: 3,
    subscribedAt: '',
    unreadCount: 0,
    postIds: ['mp1', 'mp2', 'mp3'],
  },
  {
    creatorHandle: 'lunar-press#0621',
    title: 'lunar-press',
    tagline: "Tonight's moon and sky, printed for your case.",
    coverSeed: 'lunarpress',
    tier: 'paid',
    priceUsdc: 4,
    subscribedAt: '',
    unreadCount: 0,
    postIds: ['lp1', 'lp2', 'lp3'],
  },
];

export const CIRCLE_SUBS: Subscription[] = [
  {
    creatorHandle: 'fortune-quill#0733',
    title: 'fortune-quill',
    tagline: 'One card a day, drawn at dawn. Read it slow.',
    coverSeed: 'fortune',
    tier: 'paid',
    subscribedAt: '2026-04-11T00:00:00Z',
    unreadCount: 1,
    postIds: ['p1','p2','p3','p4','p5','p6'],
    priceUsdc: 5,
    renewsAt: '2026-08-11T00:00:00Z',
    autoRenew: true,
    muted: false,
  },
  {
    creatorHandle: 'weather-brief#0011',
    title: 'weather-brief',
    tagline: 'HK 7-day forecast poster, delivered at dawn.',
    coverSeed: 'weather',
    tier: 'free',
    subscribedAt: '2026-06-30T00:00:00Z',
    unreadCount: 5,
    postIds: ['wt1','wt2','wt3','wt4','wt5','wt6','wt7'],
    muted: false,
  },
];

export const CIRCLE_GIFTS: Gift[] = [
  // Incoming
  {
    id: 'g1',
    fromHandle: 'petal-dune#5563',
    toHandle: 'fern-quill#4821',
    previewUrl: galleryAsset('animal_orange_tabby_kitten.png'),
    tokenSymbol: 'USDC',
    tokenAmount: '10.00',
    chain: 'base',
    note: 'for your desk :)',
    sentAt: '2026-07-16T12:14:00Z',
    deliveredAt: '2026-07-16T12:14:20Z',
  },
  {
    id: 'g2',
    fromHandle: 'ember-loft#0808',
    toHandle: 'fern-quill#4821',
    previewUrl: galleryAsset('landscape_red_autumn_bridge.png'),
    tokenSymbol: 'CAST',
    tokenAmount: '120',
    chain: 'base',
    note: 'reminded me of you',
    sentAt: '2026-07-15T22:02:00Z',
    deliveredAt: '2026-07-15T22:02:30Z',
    openedAt: '2026-07-16T07:41:00Z',
  },
  {
    id: 'g3',
    fromHandle: 'moss-harbor#9182',
    toHandle: 'fern-quill#4821',
    previewUrl: galleryAsset('animal_red_shiba_puppy.png'),
    tokenSymbol: 'USDC',
    tokenAmount: '5.00',
    chain: 'base',
    note: 'hbd early',
    sentAt: '2026-07-10T18:20:00Z',
    deliveredAt: '2026-07-10T18:20:15Z',
    openedAt: '2026-07-10T18:45:00Z',
  },
  // Outgoing (from me)
  {
    id: 'g4',
    fromHandle: 'fern-quill#4821',
    toHandle: 'moss-harbor#9182',
    previewUrl: galleryAsset('landscape_amber_hot_balloons.png'),
    tokenSymbol: 'USDC',
    tokenAmount: '15.00',
    chain: 'base',
    note: 'saw this and thought of you',
    sentAt: '2026-07-12T09:30:00Z',
    deliveredAt: '2026-07-12T09:30:20Z',
    openedAt: '2026-07-12T10:14:00Z',
  },
  {
    id: 'g5',
    fromHandle: 'fern-quill#4821',
    toHandle: 'moss-harbor#9182',
    previewUrl: galleryAsset('city_cream_paris_landmarks.png'),
    tokenSymbol: 'CAST',
    tokenAmount: '25',
    chain: 'base',
    sentAt: '2026-07-14T20:00:00Z',
    deliveredAt: '2026-07-14T20:00:15Z',
  },
  {
    id: 'g6',
    fromHandle: 'fern-quill#4821',
    toHandle: 'moss-harbor#9182',
    previewUrl: galleryAsset('chinese_gold_pagoda_clouds.png'),
    tokenSymbol: 'USDC',
    tokenAmount: '3.00',
    chain: 'base',
    note: 'small one',
    sentAt: '2026-07-16T08:10:00Z',
  },
  {
    id: 'g7',
    fromHandle: 'fern-quill#4821',
    toHandle: 'petal-dune#5563',
    previewUrl: galleryAsset('landscape_pink_snowy_village.png'),
    tokenSymbol: 'USDC',
    tokenAmount: '8.00',
    chain: 'base',
    sentAt: '2026-07-09T14:00:00Z',
    deliveredAt: '2026-07-09T14:00:20Z',
    openedAt: '2026-07-09T15:22:00Z',
  },
  {
    id: 'g8',
    fromHandle: 'fern-quill#4821',
    toHandle: 'petal-dune#5563',
    previewUrl: galleryAsset('animal_white_snowy_owl.png'),
    tokenSymbol: 'DEGEN',
    tokenAmount: '300',
    chain: 'base',
    note: 'a snowy owl for a snowy day',
    sentAt: '2026-07-15T11:20:00Z',
    deliveredAt: '2026-07-15T11:20:20Z',
    openedAt: '2026-07-15T13:00:00Z',
  },
];


// Ordered newest-first. The Cast tab picks the first two entries for its
// amber-ribbon Featured tiles; the queue browser walks the whole list.
export const CIRCLE_QUEUE: QueueItem[] = [
  { key: 'q1', source: 'gift', arrivedAt: '2026-07-16T12:14:20Z', refId: 'g1' },
  { key: 'q2', source: 'sub',  arrivedAt: '2026-07-16T05:31:00Z', refId: 'p1' },
  { key: 'q4', source: 'sub',  arrivedAt: '2026-07-25T06:00:30Z', refId: 'wt7' },
  { key: 'q6', source: 'gift', arrivedAt: '2026-07-15T22:03:00Z', refId: 'g2' },
];

// The current user's wallet holdings shown in the "Pay with" picker. A popular
// multi-chain spread — every symbol resolves to a real CoinCap token icon and
// every `chain` lowercases to a known Trust Wallet chain badge (see CHAINS in
// CampaignGallery/chainColors), so the asset glyphs render as real coins with
// distinct network badges. USDC/Base leads since sub prices are USDC-denominated
// (a 1:1 pay). Rates are plausible mocks.
export const TIP_TOKENS: TipToken[] = [
  { symbol: 'USDC', name: 'USD Coin',  chain: 'Base',     balance: 1250.00, usdRate: 1.00 },
  { symbol: 'ETH',  name: 'Ethereum',  chain: 'Ethereum', balance: 0.84,    usdRate: 3400 },
  { symbol: 'USDT', name: 'Tether USD', chain: 'Arbitrum', balance: 640.50, usdRate: 1.00 },
  { symbol: 'SOL',  name: 'Solana',    chain: 'Solana',   balance: 12.60,   usdRate: 185 },
  { symbol: 'BNB',  name: 'BNB',       chain: 'BNB',      balance: 1.90,    usdRate: 610 },
  { symbol: 'ARB',  name: 'Arbitrum',  chain: 'Arbitrum', balance: 430.00,  usdRate: 0.78 },
  { symbol: 'OP',   name: 'Optimism',  chain: 'Optimism', balance: 210.00,  usdRate: 1.55 },
  { symbol: 'AAVE', name: 'Aave',      chain: 'Ethereum', balance: 3.40,    usdRate: 240 },
];

export const getGift = (id: string) => CIRCLE_GIFTS.find((g) => g.id === id);
export const getSubPost = (id: string) => CIRCLE_SUB_POSTS.find((p) => p.id === id);
export const getSubscription = (handle: string) =>
  CIRCLE_SUBS.find((s) => s.creatorHandle === handle);
export const getFriend = (handle: string) =>
  CIRCLE_FRIENDS.find((f) => f.handle === handle);
export const getSubPostsFor = (handle: string) =>
  CIRCLE_SUB_POSTS.filter((p) => p.creatorHandle === handle);

// One post per subscribed creator — the single most-recent poster from each.
// Backs the Cast tab's Subs gallery, which shows the latest cover per sub
// rather than every post from every sub. Accepts the (possibly store-managed)
// subs list so an unsubscribe is reflected; defaults to the static seed.
export const getLatestSubPosts = (subs: Subscription[] = CIRCLE_SUBS): SubPost[] =>
  subs
    .map((s) =>
      getSubPostsFor(s.creatorHandle)
        .slice()
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0],
    )
    .filter(Boolean);

// Cover art for a subscription tile — the newest posts' preview images
// (CIRCLE_SUB_POSTS is stored newest-first per creator, so [0] is the latest).
// Returns up to `count` distinct posters: [0] is the focused front cover, the
// rest peek out behind it as a real stack.
export const getSubCovers = (handle: string, count = 3): string[] =>
  getSubPostsFor(handle)
    .slice(0, count)
    .map((p) => p.previewUrl);

// Utility — deterministic amber-family tint for avatar / cover placeholders.
export const seedTint = (seed: string): string => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const hue = 20 + (Math.abs(h) % 40); // amber / orange band
  const sat = 55 + (Math.abs(h >> 4) % 25);
  const lig = 42 + (Math.abs(h >> 8) % 12);
  return `hsl(${hue}, ${sat}%, ${lig}%)`;
};
