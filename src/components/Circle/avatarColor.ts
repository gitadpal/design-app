import { useEffect, useState } from 'react';

// Derives a per-friend "theme color" from the edge of their avatar. The clay
// portraits sit on a flat colored backdrop, so the four corner pixels are a
// reliable read of that backdrop hue. Public assets are same-origin, so the
// canvas stays untainted and getImageData works. Results are cached per URL so
// each avatar is sampled only once, and the cache can be warmed ahead of time
// (see warmAvatarColors) so a color is ready the instant the user navigates.

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function sample(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(url);
  if (existing) return existing;

  const p = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const s = 12;
        const canvas = document.createElement('canvas');
        canvas.width = s;
        canvas.height = s;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve('');
        ctx.drawImage(img, 0, 0, s, s);
        const corners: Array<[number, number]> = [
          [1, 1],
          [s - 2, 1],
          [1, s - 2],
          [s - 2, s - 2],
        ];
        let r = 0, g = 0, b = 0;
        for (const [x, y] of corners) {
          const d = ctx.getImageData(x, y, 1, 1).data;
          r += d[0];
          g += d[1];
          b += d[2];
        }
        const color = `rgb(${Math.round(r / 4)}, ${Math.round(g / 4)}, ${Math.round(b / 4)})`;
        cache.set(url, color);
        resolve(color);
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = url;
  });

  inflight.set(url, p);
  return p;
}

export function warmAvatarColors(urls: string[]): void {
  urls.forEach((u) => {
    if (u) void sample(u);
  });
}

// React hook — returns the sampled color once available, the fallback until
// then. Synchronous on the fast path when the cache is already warm.
export function useAvatarColor(url: string | undefined, fallback: string): string {
  const [color, setColor] = useState<string>(() => (url && cache.get(url)) || fallback);
  useEffect(() => {
    let active = true;
    if (!url) {
      setColor(fallback);
      return;
    }
    const cached = cache.get(url);
    if (cached) {
      setColor(cached);
      return;
    }
    sample(url).then((c) => {
      if (active && c) setColor(c);
    });
    return () => {
      active = false;
    };
  }, [url, fallback]);
  return color;
}

// --- color math ------------------------------------------------------------

export function colorToHsl(color: string): [number, number, number] {
  const hsl = color.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
  if (hsl) return [Math.round(+hsl[1]), Math.round(+hsl[2]), Math.round(+hsl[3])];
  const rgb = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  const r = rgb ? +rgb[1] : 180;
  const g = rgb ? +rgb[2] : 140;
  const b = rgb ? +rgb[3] : 90;
  return rgbToHsl(r, g, b);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
