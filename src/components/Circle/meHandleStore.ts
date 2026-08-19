import { useSyncExternalStore } from 'react';
import { CIRCLE_ME } from '../../data/circleData';

// Module-level store for the current user's own Circle handle. Seeded from
// CIRCLE_ME so an identity exists by default; the "Edit handle" sheet in Circle
// settings lets the user rename themselves, and every reader (hub header,
// settings row, QR, share block) updates at once. In-memory only, matching the
// other Circle stores — no backend.
//
// A rename keeps your identity: gifts and blocks recorded under a former handle
// are still yours, so we remember every handle this account has ever held and
// match identity against that whole set (isMyHandle) rather than only the
// latest string. That keeps gift-direction and self-checks correct across a
// rename even though the pre-seeded mock data references the original handle.

// Canonical handle shape — two lowercase words joined by a hyphen plus a
// 4-digit discriminator, e.g. `fern-quill#4821`. Kept in sync with the local
// copies in AddFriend / BlockListSheet.
export const HANDLE_RE = /^[a-z]+-[a-z]+#\d{4}$/;

let handle: string = CIRCLE_ME.handle;
// Every handle this account has used, current included — the identity set.
const known = new Set<string>([CIRCLE_ME.handle]);
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

// Rename the account. Callers are expected to have validated shape/availability
// (see HANDLE_RE); a no-op when the handle is unchanged.
export function setMyHandle(next: string): void {
  const trimmed = next.trim();
  if (!trimmed || trimmed === handle) return;
  handle = trimmed;
  known.add(trimmed);
  emit();
}

function getMyHandle(): string {
  return handle;
}

// True if the candidate is — or ever was — the current user's handle. Use this
// for gift-direction and self-checks so a rename never re-attributes history.
export function isMyHandle(candidate: string): boolean {
  return known.has(candidate);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// Reactive read of the current handle — for display surfaces that should
// re-render the moment the user renames themselves.
export function useMyHandle(): string {
  return useSyncExternalStore(subscribe, getMyHandle, getMyHandle);
}
