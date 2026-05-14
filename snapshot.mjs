import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
import { join } from 'path';

const SIZES = [
  [1260, 2736],
  [1242, 2688],
  [1206, 2622],
  [1125, 2436],
  [1242, 2208],
  [2064, 2752],
];

const PAGES = [
  { name: 'earnings', hash: '' },
  { name: 'cast', hash: 'cast' },
  { name: 'assets', hash: 'assets', wait: 3000 },
  { name: 'campaign-detail', hash: 'campaign-detail/1' },
  { name: 'cast-preview', hash: 'cast-preview/1' },
];

const APP_URL = 'http://localhost:3000';
const SNAPSHOT_DIR = join(import.meta.dirname, 'snapshot');

// Find Chrome
const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

let executablePath;
for (const p of CHROME_PATHS) {
  try {
    const { accessSync } = await import('fs');
    accessSync(p);
    executablePath = p;
    break;
  } catch {}
}
if (!executablePath) {
  console.error('Chrome not found');
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
});

async function capturePageAtSize(pageDef, width, height) {
  const outDir = join(SNAPSHOT_DIR, `${width}x${height}`);
  mkdirSync(outDir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });

  const url = pageDef.hash ? `${APP_URL}#/${pageDef.hash}` : APP_URL;
  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, pageDef.wait || 1500));

  await page.screenshot({
    path: join(outDir, `${pageDef.name}.png`),
    fullPage: false,
  });

  await page.close();
}

console.log('\nCapturing snapshots...\n');

for (const [width, height] of SIZES) {
  console.log(`${width}x${height}:`);
  for (const pageDef of PAGES) {
    await capturePageAtSize(pageDef, width, height);
    console.log(`  ✓ ${pageDef.name}.png`);
  }
}

await browser.close();
console.log('\nDone!\n');
