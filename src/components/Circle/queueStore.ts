import { useSyncExternalStore } from 'react';
import { CIRCLE_QUEUE, type QueueItem } from '../../data/circleData';

// Module-level store for the Circle cast queue. Seeded from the mock data, but
// lets a card be dismissed — by tossing it in the queue browser, or once it's
// actually cast to the display — and have that removal reflected everywhere at
// once (the browser deck, the Cast tab's queue count badge, the Featured
// ribbon tiles) without a real backend.

let queue: QueueItem[] = CIRCLE_QUEUE.slice();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

// Remove a queue entry by key. No-op if it's already gone (e.g. tossed and then
// cast), so callers don't need to guard.
export function dismissFromQueue(key: string): void {
  const next = queue.filter((q) => q.key !== key);
  if (next.length === queue.length) return;
  queue = next;
  emit();
}

function getQueue(): QueueItem[] {
  return queue;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// Reactive live queue — subscribes so a dismissal updates every reader.
export function useQueue(): QueueItem[] {
  return useSyncExternalStore(subscribe, getQueue, getQueue);
}
