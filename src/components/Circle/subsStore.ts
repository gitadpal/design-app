import { useSyncExternalStore } from 'react';
import { CIRCLE_SUBS, type Subscription } from '../../data/circleData';

// Module-level store for the user's subscriptions. Seeded from the mock data,
// but lets the Manage-subscription sheet change a plan, toggle auto-renew, mute
// alerts, or unsubscribe — and have that reflected across the hub, the Circle
// settings, the subscription detail, and the Cast tab's Subs gallery at once,
// with no real backend.

let subs: Subscription[] = CIRCLE_SUBS.map((s) => ({ ...s }));
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function getSubs(): Subscription[] {
  return subs;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// Patch a single subscription (tier change, auto-renew, mute, renewal date…).
export function updateSubscription(handle: string, patch: Partial<Subscription>): void {
  subs = subs.map((s) => (s.creatorHandle === handle ? { ...s, ...patch } : s));
  emit();
}

// Unsubscribe = deactivate, NOT delete. The sub stays in the library so its
// already-received posters remain viewable and castable; only new deliveries
// and billing stop (autoRenew off).
export function unsubscribe(handle: string): void {
  subs = subs.map((s) =>
    s.creatorHandle === handle ? { ...s, active: false, autoRenew: false } : s,
  );
  emit();
}

// Subscribe to a creator — reactivate one that's already in the library, or add
// a new one (e.g. from the Explore catalog). Idempotent for an active sub.
export function subscribeTo(sub: Subscription): void {
  const existing = subs.find((s) => s.creatorHandle === sub.creatorHandle);
  if (existing) {
    subs = subs.map((s) =>
      s.creatorHandle === sub.creatorHandle ? { ...s, active: true } : s,
    );
  } else {
    subs = [...subs, { ...sub, active: true, subscribedAt: new Date().toISOString() }];
  }
  emit();
}

// Reactive full list.
export function useSubscriptions(): Subscription[] {
  return useSyncExternalStore(subscribe, getSubs, getSubs);
}

// Reactive single subscription (undefined once unsubscribed).
export function useSubscription(handle: string): Subscription | undefined {
  const all = useSyncExternalStore(subscribe, getSubs, getSubs);
  return all.find((s) => s.creatorHandle === handle);
}
