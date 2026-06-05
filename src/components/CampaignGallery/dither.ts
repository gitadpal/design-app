import { useEffect, useRef, useState } from 'react';

// Floyd–Steinberg error-diffusion dither, quantized to four grey levels
// (0/85/170/255). Matches typical 2-bit e-ink rendering and produces the
// signature stippled texture we want the user to see before they commit:
// hardware-honest preview of what the case will display.
//
// The image is downsampled to ~132×184 first (close to the e-ink panel's
// effective resolution) so the dither pattern reads at preview size. Some
// upstream image hosts don't enable CORS and the canvas read throws — we
// catch that and signal failure so the caller can fall back to a CSS-based
// proxy (grayscale + contrast).

const DITHER_W = 132;
const DITHER_H = Math.round(DITHER_W * (16 / 11)); // 11:16 e-ink aspect

function quantize(v: number): number {
  // Snap to 4 levels: 0, 85, 170, 255
  return Math.round(Math.max(0, Math.min(255, v)) / 85) * 85;
}

export function ditherImageToDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = DITHER_W;
  canvas.height = DITHER_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');

  // Draw the source image scaled (object-cover semantics) into the e-ink
  // canvas. Compute the crop rect so the visible region matches what the
  // user saw in the open card.
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const srcRatio = srcW / srcH;
  const dstRatio = DITHER_W / DITHER_H;
  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;
  if (srcRatio > dstRatio) {
    // image wider than target — crop sides
    sw = srcH * dstRatio;
    sx = (srcW - sw) / 2;
  } else {
    // image taller than target — crop top/bottom
    sh = srcW / dstRatio;
    sy = (srcH - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, DITHER_W, DITHER_H);

  // CORS-tainted canvases throw on getImageData — let the caller fall back.
  const imageData = ctx.getImageData(0, 0, DITHER_W, DITHER_H);
  const data = imageData.data;

  // Pull RGB into a float grayscale buffer using the perceptual luma weights.
  const gray = new Float32Array(DITHER_W * DITHER_H);
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Slight contrast bump so the dithered look reads punchy rather than mud.
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = (lum - 128) * 1.15 + 128;
  }

  // Floyd–Steinberg: at each pixel, snap to the nearest level and push the
  // residual error into neighbors so the average tone is preserved while the
  // local structure breaks into stipple.
  for (let y = 0; y < DITHER_H; y++) {
    for (let x = 0; x < DITHER_W; x++) {
      const i = y * DITHER_W + x;
      const oldV = gray[i];
      const newV = quantize(oldV);
      gray[i] = newV;
      const err = oldV - newV;
      if (x + 1 < DITHER_W) gray[i + 1] += (err * 7) / 16;
      if (y + 1 < DITHER_H) {
        if (x > 0) gray[i + DITHER_W - 1] += (err * 3) / 16;
        gray[i + DITHER_W] += (err * 5) / 16;
        if (x + 1 < DITHER_W) gray[i + DITHER_W + 1] += (err * 1) / 16;
      }
    }
  }

  // Write grayscale back into the canvas buffer + flush.
  for (let i = 0; i < gray.length; i++) {
    const v = Math.max(0, Math.min(255, gray[i]));
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
}

// React hook: kicks off dithering when `src` changes; returns the data URL or
// null while loading / on CORS failure. Callers can fall back to the CSS
// approximation when this is null.
export function useDitheredImage(src: string | null, enabled: boolean): string | null {
  const [result, setResult] = useState<string | null>(null);
  const lastSrc = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !src) {
      setResult(null);
      return;
    }
    // Skip re-dithering the same source — the operation is ~5–10ms but the
    // re-renders ripple through the card.
    if (lastSrc.current === src && result) return;
    lastSrc.current = src;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const url = ditherImageToDataUrl(img);
        if (!cancelled) setResult(url);
      } catch {
        // CORS-tainted, decode failure, or no canvas — let the caller fall
        // back. Silently null is fine; the CSS proxy still reads as e-ink-ish.
        if (!cancelled) setResult(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) setResult(null);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
}
