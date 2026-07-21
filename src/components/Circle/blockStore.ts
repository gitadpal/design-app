import { useSyncExternalStore } from 'react';

// Module-level store for the user's block list — handles that can't reach them
// (no gifts, no friend requests). Seeded with a couple of spammy handles so the
// management UI reads as a real, populated list; the Block-list sheet in Circle
// settings adds and removes entries, and every reader updates at once.
// In-memory only, matching the other Circle stores — no backend.

let blocked: string[] = ['promo-blast#0004', 'airdrop-bot#9910'];
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

// Block a handle. Deduped and newest-first so a fresh block sits at the top.
export function blockHandle(handle: string): void {
  const h = handle.trim().toLowerCase();
  if (!h) return;
  blocked = [h, ...blocked.filter((b) => b !== h)];
  emit();
}

export function unblockHandle(handle: string): void {
  blocked = blocked.filter((b) => b !== handle);
  emit();
}

export function isBlocked(handle: string): boolean {
  return blocked.includes(handle.trim().toLowerCase());
}

function getBlocked(): string[] {
  return blocked;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useBlockedHandles(): string[] {
  return useSyncExternalStore(subscribe, getBlocked, getBlocked);
}
