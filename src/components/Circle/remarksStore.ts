import { useSyncExternalStore } from 'react';

// Module-level store for per-friend remark overrides. Backend is out of scope
// (see CIRCLE_DESIGN.md); this keeps edits alive across Circle sub-views
// without prop-drilling and without pulling in a real state library.

const listeners = new Set<() => void>();
let remarks: Record<string, string> = {};

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): Record<string, string> {
  return remarks;
}

export function setRemark(handle: string, next: string): void {
  const trimmed = next.trim();
  const cleared = trimmed.length === 0;
  if (cleared && !(handle in remarks)) return;
  if (!cleared && remarks[handle] === trimmed) return;
  const copy = { ...remarks };
  if (cleared) delete copy[handle];
  else copy[handle] = trimmed;
  remarks = copy;
  listeners.forEach((l) => l());
}

export function useRemarks(): Record<string, string> {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useRemark(handle: string): string | undefined {
  return useRemarks()[handle];
}
