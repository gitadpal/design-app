import type { QueueItem } from '../../data/circleData';
import {
  getGift,
  getSubPost,
  getSubscription,
  getFriend,
} from '../../data/circleData';

export interface ResolvedQueueItem {
  key: string;
  source: QueueItem['source'];
  previewUrl: string;
  headline: string;           // e.g. "🎁 from @petal-dune"
  subheadline?: string;
  attribution: string;        // shown on ribbon tiles: "@handle"
  timeLabel: string;
  note?: string;
  tokenLine?: string;         // "+10 USDC · credited"
  refId: string;
  arrivedAt: string;
}

const ago = (iso: string): string => {
  const t = new Date(iso).getTime();
  const now = new Date('2026-07-16T13:00:00Z').getTime(); // deterministic "now" for mocks
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

export function resolveQueueItem(q: QueueItem): ResolvedQueueItem | null {
  if (q.source === 'gift') {
    const g = getGift(q.refId);
    if (!g) return null;
    return {
      key: q.key,
      source: 'gift',
      previewUrl: g.previewUrl,
      headline: `🎁 from @${g.fromHandle.split('#')[0]}`,
      subheadline: `#${g.fromHandle.split('#')[1]}`,
      attribution: `@${g.fromHandle.split('#')[0]}`,
      timeLabel: ago(g.sentAt),
      note: g.note,
      tokenLine: `+${g.tokenAmount} ${g.tokenSymbol} · credited`,
      refId: q.refId,
      arrivedAt: q.arrivedAt,
    };
  }
  if (q.source === 'sub') {
    const p = getSubPost(q.refId);
    if (!p) return null;
    const sub = getSubscription(p.creatorHandle);
    const handle = p.creatorHandle.split('#')[0];
    return {
      key: q.key,
      source: 'sub',
      previewUrl: p.previewUrl,
      headline: `⧫ from @${handle}`,
      subheadline: p.title ?? sub?.tagline,
      attribution: `@${handle}`,
      timeLabel: ago(p.publishedAt),
      refId: q.refId,
      arrivedAt: q.arrivedAt,
    };
  }
  return null;
}

export const RIBBON_ICONS: Record<QueueItem['source'], string> = {
  gift: '🎁',
  sub: '⧫',
};

// Convenience — for a fresh friend, avatar text is the first two letters
// of the wordy prefix.
export function initialsFromHandle(handle: string): string {
  const prefix = handle.split('#')[0];
  const parts = prefix.split('-');
  return (parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '');
}

export { getFriend };
