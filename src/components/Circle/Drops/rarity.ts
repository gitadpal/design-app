// Drops rarity system — the gacha dial. Every creation rolls a finish from this
// published, fixed-odds table (the "provably fair" posture from DROPS_VISION §10:
// odds are disclosed in-app before any paid roll). This module is the low-level
// leaf: pure logic + visual tokens, no React, no data imports — so both the data
// layer and the components can depend on it without a cycle.

export type Rarity = 'common' | 'rare' | 'holo' | 'gold' | 'secret';

// Draw order for the collection sort (rarest first) and the "you pulled…" ladder.
export const RARITY_ORDER: Record<Rarity, number> = {
  secret: 0,
  gold: 1,
  holo: 2,
  rare: 3,
  common: 4,
};

// Published odds. These are shown verbatim in the creation flow — changing them
// here changes the disclosed table, so keep them summing to 1.
export const RARITY_ODDS: Record<Rarity, number> = {
  common: 0.58,
  rare: 0.27,
  holo: 0.1,
  gold: 0.04,
  secret: 0.01,
};

// The 1-of-N chase. A secret pull is minted with a serial (#k / SECRET_EDITION),
// the phygital-provenance hook from the vision (§5) made tangible in the UI.
export const SECRET_EDITION = 50;

export interface RarityMeta {
  key: Rarity;
  label: string;
  // Short odds string for the disclosure table, e.g. "10%".
  chance: string;
  // Accent used for the badge fill + glow. Common stays neutral; the chase tiers
  // climb toward the brand Prism (mint → violet) so rarity reads as "more Web3".
  accent: string;
  // Badge text color against `accent`.
  onAccent: string;
}

export const RARITY_META: Record<Rarity, RarityMeta> = {
  common: { key: 'common', label: 'Common', chance: '58%', accent: '#9ca3af', onAccent: '#1A1A1A' },
  rare:   { key: 'rare',   label: 'Rare',   chance: '27%', accent: '#7dd3fc', onAccent: '#0A1620' },
  holo:   { key: 'holo',   label: 'Holo',   chance: '10%', accent: '#c4b5fd', onAccent: '#160A20' },
  gold:   { key: 'gold',   label: 'Gold',   chance: '4%',  accent: '#fbbf24', onAccent: '#1A1200' },
  secret: { key: 'secret', label: 'Secret', chance: '1%',  accent: '#00FFC2', onAccent: '#001A14' },
};

// Rarest-first list for disclosure tables and legends.
export const RARITIES_BY_RARITY: Rarity[] = (Object.keys(RARITY_META) as Rarity[]).sort(
  (a, b) => RARITY_ORDER[a] - RARITY_ORDER[b],
);

// Weighted roll against the published odds. Uses Math.random — creation is a
// user-initiated action, never a render/effect, so this stays out of React's
// render path.
export function rollRarity(): Rarity {
  const r = Math.random();
  let acc = 0;
  // Walk commonest → rarest so the fat head is checked first.
  const order: Rarity[] = ['common', 'rare', 'holo', 'gold', 'secret'];
  for (const key of order) {
    acc += RARITY_ODDS[key];
    if (r < acc) return key;
  }
  return 'common';
}

// Whether a finish gets the animated sheen/foil treatment (everything above rare).
export const isSpecialFinish = (r: Rarity): boolean => r === 'holo' || r === 'gold' || r === 'secret';
