// Mock data for Drops — the collectible-character economy that lives inside
// Circle, parallel to Subs (see DROPS_VISION.md). Backend + real generation are
// out of scope for Phase 1: the "AI" is a curated character pool, and every
// creation / blind-box pull is a local roll. Two distinct surfaces share these
// shapes:
//
//   • Creation (the Drops section): the user makes a character with Seeded
//     Surprise or Artist mode. The result is VISIBLE — you see what you made —
//     with a rolled rarity finish. Never sealed to its creator.
//   • Sealed sale (in Subs): a creator sells a blind box. Buying rolls a hidden
//     Drop that arrives SEALED; you reveal it by casting to your case. Only these
//     acquired drops carry sealed=true, and only until the reveal ritual runs.

import type { Rarity } from '../components/Circle/Drops/rarity';
import { rollRarity, SECRET_EDITION } from '../components/Circle/Drops/rarity';

// How a Drop was authored. Drives the creation psychology, not the ownership.
export type DropMode = 'seeded' | 'artist';

// How a Drop entered the collection. 'created' = minted by the user (visible);
// 'sealed' = acquired as a blind box from a sub (revealed by casting).
export type DropSource = 'created' | 'sealed';

export interface DropSeries {
  id: string;
  title: string;
  tagline: string;
  // The curated character pool the mock "generator" draws from. Real generation
  // would replace this with a model call seeded by the series + user seed.
  pool: string[];
}

export interface Drop {
  id: string;
  name: string;
  seriesId: string;
  mode: DropMode;
  source: DropSource;
  imageUrl: string;
  rarity: Rarity;
  // Serial for a secret pull: k in "#k / 50". Only set when rarity === 'secret'.
  serial?: number;
  // The seed word (Seeded Surprise) or prompt (Artist mode) that authored it.
  seed?: string;
  ownerHandle: string;
  createdAt: string; // ISO
  // true = acquired sealed and not yet revealed. Always false for created drops.
  sealed: boolean;
  // Provenance for a sealed pull — the sub/creator whose blind box it came from.
  fromCreator?: string;
}

// A blind box sold through Subs. Buying rolls one Drop from `seriesId` into the
// collection, sealed. The sale channel is the vision's "sealed, independent of
// creation" mode — it lives on the Subs surface, not the Drops one.
export interface SealedDropOffer {
  id: string;
  creatorHandle: string;
  title: string;
  seriesId: string;
  priceUsdc: number;
  keyArt: string;
  blurb: string;
  // 1-of-N badge shown on the shelf (edition marketing), decorative.
  edition: number;
}

const gallery = (f: string) => `${import.meta.env.BASE_URL}gallery/${f}`;
const avatar = (n: number) =>
  `${import.meta.env.BASE_URL}avatar/avatar_${String(n).padStart(3, '0')}.png`;

// ── Series & their curated character pools ─────────────────────────────────
// Each maps to real portrait art already shipped under public/. A style the
// user picks in Seeded Surprise; the subject the AI "rolls" from that pool.

export const DROP_SERIES: DropSeries[] = [
  {
    id: 'clay-spirits',
    title: 'Clay Spirits',
    tagline: 'Hand-pressed porcelain souls, each kiln-fired once.',
    pool: Array.from({ length: 16 }, (_, i) => avatar(i + 1)),
  },
  {
    id: 'tiny-beasts',
    title: 'Tiny Beasts',
    tagline: 'Pocket companions from the cozy understory.',
    pool: [
      'animal_amber_collie_puppy.png',
      'animal_amber_field_mouse.png',
      'animal_black_dwarf_rabbit.png',
      'animal_brown_bear_cub.png',
      'animal_caramel_hamster_seeds.png',
      'animal_cream_lamb_meadow.png',
      'animal_ginger_netherland_rabbit.png',
      'animal_orange_onsen_capybara.png',
      'animal_orange_retriever_puppy.png',
      'animal_orange_snowy_fox.png',
      'animal_orange_tabby_kitten.png',
      'animal_red_panda_leaf.png',
      'animal_red_piglet_dandelion.png',
      'animal_red_squirrel_acorn.png',
      'animal_white_panda_cub.png',
      'animal_white_snowy_owl.png',
    ].map(gallery),
  },
  {
    id: 'ember-wyrms',
    title: 'Ember Wyrms',
    tagline: 'Hatchlings with a spark — some carry a little more fire.',
    pool: [
      'animal_red_baby_dragon.png',
      'animal_red_dragon_hatchling.png',
      'animal_gold_chinese_dragon.png',
      'animal_red_scarlet_ibis.png',
      'animal_red_scarlet_rooster.png',
      'animal_orange_baby_orangutan.png',
    ].map(gallery),
  },
  {
    id: 'festival-folk',
    title: 'Festival Folk',
    tagline: 'Lantern-lit revelers, printed for your case.',
    pool: [
      'chinese_red_bamboo_girl.png',
      'chinese_red_lion_dance.png',
      'chinese_red_panda_envelope.png',
      'chinese_gold_rooftop_cat.png',
      'chinese_red_courtyard_cat.png',
      'chinese_red_rabbit_mandarins.png',
      'chinese_red_firecracker_family.png',
      'chinese_red_sparkler_siblings.png',
    ].map(gallery),
  },
];

export const getSeries = (id: string): DropSeries =>
  DROP_SERIES.find((s) => s.id === id) ?? DROP_SERIES[0];

// ── Whimsical name generator ───────────────────────────────────────────────
// A collectible needs a name you can get attached to (the endowment effect the
// vision leans on, §5). Given-name + epithet, rolled once and stored on the drop.
const GIVEN_NAMES = [
  'Pip', 'Suri', 'Miso', 'Bao', 'Nim', 'Tato', 'Oma', 'Yuki', 'Fen', 'Koa',
  'Remy', 'Juni', 'Poppy', 'Cricket', 'Momo', 'Ollie', 'Wren', 'Bramble',
  'Clove', 'Sable', 'Fig', 'Pesto', 'Waffle', 'Dumpling',
];
const EPITHETS = [
  'the Ember', 'the Small', 'the Bold', 'no. 7', 'the Quiet', 'the Bright',
  'the Elder', 'the Roamer', 'the Tender', 'the Sly', 'the Ninth', 'of the Dawn',
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const generateDropName = (): string => `${pick(GIVEN_NAMES)} ${pick(EPITHETS)}`;

// Collision-resistant enough id for a mock. App code, so Date/Math are fine.
let dropSeq = 0;
export const nextDropId = (): string =>
  `drop_${Date.now().toString(36)}_${(dropSeq++).toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`;

// Roll one candidate character from a series — the core "generation" primitive.
// `sealedResult` controls whether the pull is hidden (blind-box) or visible
// (creation). The rarity finish is always rolled here so the chase is real even
// for visible creations; the caller decides whether to show it yet.
export function rollDrop(params: {
  seriesId: string;
  mode: DropMode;
  source: DropSource;
  seed?: string;
  sealed?: boolean;
  fromCreator?: string;
}): Drop {
  const series = getSeries(params.seriesId);
  const rarity = rollRarity();
  return {
    id: nextDropId(),
    name: generateDropName(),
    seriesId: series.id,
    mode: params.mode,
    source: params.source,
    imageUrl: pick(series.pool),
    rarity,
    serial: rarity === 'secret' ? 1 + Math.floor(Math.random() * SECRET_EDITION) : undefined,
    seed: params.seed,
    ownerHandle: 'fern-quill#4821',
    createdAt: new Date().toISOString(),
    sealed: params.sealed ?? false,
    fromCreator: params.fromCreator,
  };
}

// ── Sealed blind boxes sold through Subs ───────────────────────────────────
export const SEALED_OFFERS: SealedDropOffer[] = [
  {
    id: 'box-ember',
    creatorHandle: 'kiln-and-coal#0440',
    title: 'Ember Wyrms — Sealed Box',
    seriesId: 'ember-wyrms',
    priceUsdc: 4,
    keyArt: gallery('animal_red_dragon_hatchling.png'),
    blurb: 'One hatchling, sealed. Cast to your case to hatch it. 1% chance of a Secret wyrm.',
    edition: 50,
  },
  {
    id: 'box-clay',
    creatorHandle: 'quiet-kiln#0177',
    title: 'Clay Spirits — Sealed Box',
    seriesId: 'clay-spirits',
    priceUsdc: 3,
    keyArt: avatar(4),
    blurb: 'A porcelain soul, kiln-sealed. The finish is a mystery until it develops on e-ink.',
    edition: 100,
  },
  {
    id: 'box-festival',
    creatorHandle: 'lantern-house#0902',
    title: 'Festival Folk — Sealed Box',
    seriesId: 'festival-folk',
    priceUsdc: 3,
    keyArt: gallery('chinese_red_lion_dance.png'),
    blurb: 'A lantern-lit reveler, wrapped. Reveal by casting — chase the Gold foil.',
    edition: 88,
  },
];

export const getOffer = (id: string) => SEALED_OFFERS.find((o) => o.id === id);

// ── Seed collection ────────────────────────────────────────────────────────
// A handful of drops so the section is alive on first open: a spread of finishes
// (incl. one holo, one gold, one 1-of-50 secret) plus one sealed box already
// bought and awaiting its reveal — so the cast-to-reveal ritual is discoverable
// immediately, before the user buys anything.
export const SEED_DROPS: Drop[] = [
  {
    id: 'seed_1', name: 'Momo the Bright', seriesId: 'clay-spirits', mode: 'seeded', source: 'created',
    imageUrl: avatar(2), rarity: 'holo', seed: 'porcelain', ownerHandle: 'fern-quill#4821',
    createdAt: '2026-07-10T09:12:00Z', sealed: false,
  },
  {
    id: 'seed_2', name: 'Pip the Ember', seriesId: 'ember-wyrms', mode: 'seeded', source: 'created',
    imageUrl: gallery('animal_red_baby_dragon.png'), rarity: 'gold', seed: 'spark',
    ownerHandle: 'fern-quill#4821', createdAt: '2026-07-12T14:40:00Z', sealed: false,
  },
  {
    id: 'seed_3', name: 'Wren the Ninth', seriesId: 'tiny-beasts', mode: 'artist', source: 'created',
    imageUrl: gallery('animal_orange_snowy_fox.png'), rarity: 'secret', serial: 9,
    seed: 'a small fox with a coat of first snow', ownerHandle: 'fern-quill#4821',
    createdAt: '2026-07-14T20:05:00Z', sealed: false,
  },
  {
    id: 'seed_4', name: 'Bao the Small', seriesId: 'tiny-beasts', mode: 'seeded', source: 'created',
    imageUrl: gallery('animal_white_panda_cub.png'), rarity: 'rare', seed: 'bamboo',
    ownerHandle: 'fern-quill#4821', createdAt: '2026-07-15T08:30:00Z', sealed: false,
  },
  {
    id: 'seed_5', name: 'Clove the Quiet', seriesId: 'festival-folk', mode: 'seeded', source: 'created',
    imageUrl: gallery('chinese_red_courtyard_cat.png'), rarity: 'common', seed: 'lantern',
    ownerHandle: 'fern-quill#4821', createdAt: '2026-07-16T11:00:00Z', sealed: false,
  },
  // A sealed box already bought — hidden until the reveal ritual runs. The stored
  // imageUrl/rarity are the pre-rolled outcome, kept secret by the sealed flag.
  {
    id: 'seed_sealed_1', name: 'Sealed Wyrm', seriesId: 'ember-wyrms', mode: 'seeded', source: 'sealed',
    imageUrl: gallery('animal_red_dragon_hatchling.png'), rarity: 'holo',
    ownerHandle: 'fern-quill#4821', createdAt: '2026-07-17T19:20:00Z', sealed: true,
    fromCreator: 'kiln-and-coal#0440',
  },
];
