import { useSyncExternalStore } from 'react';
import { SEED_DROPS, type Drop } from '../../../data/dropsData';

// Module-level store for the user's Drops collection + creation plan. Mirrors
// subsStore's useSyncExternalStore shape so the Drops section, the create flow,
// the reveal ritual, and the Subs blind-box shop all read/write one source of
// truth with no backend. A minted or purchased drop shows up everywhere at once;
// revealing a sealed drop flips it in place.

// ── Creation plan ──────────────────────────────────────────────────────────
// The single most important dial in the product (vision §4): tries are tiered to
// the revenue model. Pay-per-creation buys 3 tries; premium subscription grants
// 5. `plan` is mock local state — the create flow's SiXPay checkout (payg) or an
// upsell (premium) sets it.
export type DropPlan = 'payg' | 'premium';
export const TRIES_BY_PLAN: Record<DropPlan, number> = { payg: 3, premium: 5 };
// Per-creation price for pay-per-creation, charged once via SiXPay for 3 tries.
export const CREATION_PRICE_USDC = 2;

let drops: Drop[] = SEED_DROPS.map((d) => ({ ...d }));
let plan: DropPlan = 'payg';
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}
function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getDrops(): Drop[] {
  return drops;
}
function getPlan(): DropPlan {
  return plan;
}

// Add a freshly minted (created) or freshly bought (sealed) drop to the front of
// the collection.
export function addDrop(drop: Drop): void {
  drops = [drop, ...drops];
  emit();
}

// Reveal a sealed drop in place — the pre-rolled image/rarity were always on the
// object; this just lifts the seal so the whole app now shows it.
export function revealDrop(id: string): void {
  drops = drops.map((d) => (d.id === id ? { ...d, sealed: false } : d));
  emit();
}

// Gift a drop away — it leaves the collection (a directed transfer; the mock
// doesn't model the recipient's inventory).
export function giftDrop(id: string): void {
  drops = drops.filter((d) => d.id !== id);
  emit();
}

export function setPlan(next: DropPlan): void {
  plan = next;
  emit();
}

// ── Reactive hooks ─────────────────────────────────────────────────────────
export function useDrops(): Drop[] {
  return useSyncExternalStore(subscribe, getDrops, getDrops);
}
export function useDrop(id: string | null): Drop | undefined {
  const all = useSyncExternalStore(subscribe, getDrops, getDrops);
  return id ? all.find((d) => d.id === id) : undefined;
}
export function usePlan(): DropPlan {
  return useSyncExternalStore(subscribe, getPlan, getPlan);
}
