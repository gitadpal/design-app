import { useSyncExternalStore } from 'react';
import { CIRCLE_FRIENDS, type Friend } from '../../data/circleData';

// Module-level store for the friend list. Seeded from the mock data, but lets
// the "add friend" flow prepend new friends and have every Circle surface
// (hub grid, friend-history lookup) react to it without a real backend.

let friends: Friend[] = CIRCLE_FRIENDS.slice();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

// Prepend a friend so the newest addition sits first in the grid. Deduped by
// handle — re-adding an existing handle just moves it to the front.
export function addFriend(friend: Friend): void {
  friends = [friend, ...friends.filter((f) => f.handle !== friend.handle)];
  emit();
}

export function getFriends(): Friend[] {
  return friends;
}

export function findFriend(handle: string): Friend | undefined {
  return friends.find((f) => f.handle === handle);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useFriends(): Friend[] {
  return useSyncExternalStore(subscribe, getFriends, getFriends);
}
