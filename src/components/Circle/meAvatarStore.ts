import { useSyncExternalStore } from 'react';
import { CIRCLE_ME, avatarForHandle } from '../../data/circleData';

// Module-level store for the current user's own avatar. Defaults to a stable
// portrait derived from their handle; the handle card lets them upload their
// own (read as a data URL), and every reader updates at once.

let avatarUrl: string = avatarForHandle(CIRCLE_ME.handle);
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function setMyAvatar(url: string): void {
  avatarUrl = url;
  emit();
}

function getMyAvatar(): string {
  return avatarUrl;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useMyAvatar(): string {
  return useSyncExternalStore(subscribe, getMyAvatar, getMyAvatar);
}
