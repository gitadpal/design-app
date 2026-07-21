import { useSyncExternalStore } from 'react';
import { CIRCLE_GIFTS, type Gift } from '../../data/circleData';

// Module-level store for gifts. Seeded from the mock data, but lets a gift sent
// from the tip composer persist and show up in the friend's history without a
// real backend.

let gifts: Gift[] = CIRCLE_GIFTS.slice();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function addGift(gift: Gift): void {
  gifts = [...gifts, gift];
  emit();
}

function getGifts(): Gift[] {
  return gifts;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// Reactive: every gift exchanged with `handle`, newest first. Subscribes to the
// store so a freshly-sent gift appears immediately.
export function useGiftsWithFriend(handle: string): Gift[] {
  const all = useSyncExternalStore(subscribe, getGifts, getGifts);
  return all
    .filter((g) => g.fromHandle === handle || g.toHandle === handle)
    .slice()
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}
