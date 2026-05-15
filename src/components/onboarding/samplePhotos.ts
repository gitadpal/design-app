// Two sets of e-ink display images, keyed by the welcome page's title category:
//   - earn → ads / monetization-themed visuals shown while "Earn while your
//     phone rests." is on screen.
//   - play → personal / art-themed visuals shown while "Play with art that
//     moves you." is on screen. Drop new files into the corresponding folder
//     and Vite's glob picks them up at build time — no code change needed.
const bundledEarn = import.meta.glob(
  '../../assets/onboarding-samples/earn/*.{png,jpg,jpeg,webp,gif}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;
const bundledPlay = import.meta.glob(
  '../../assets/onboarding-samples/play/*.{png,jpg,jpeg,webp,gif}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

export interface SamplePhoto {
  src: string;
  name: string;
}

export type SampleCategory = 'earn' | 'play';

const fallbackGradients: SamplePhoto[] = [
  { src: gradientDataUrl('#BC13FE', '#00FFC2', 'Prism'), name: 'Prism' },
  { src: gradientDataUrl('#1A1A1A', '#00FFC2', 'Mint Fog'), name: 'Mint Fog' },
  { src: gradientDataUrl('#FA709A', '#FEE140', 'Sunset'), name: 'Sunset' },
  { src: gradientDataUrl('#4FACFE', '#00F2FE', 'Lagoon'), name: 'Lagoon' },
  { src: gradientDataUrl('#43E97B', '#38F9D7', 'Mint Air'), name: 'Mint Air' },
];

function gradientDataUrl(from: string, to: string, label: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 528 768'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${from}'/>
        <stop offset='100%' stop-color='${to}'/>
      </linearGradient>
    </defs>
    <rect width='528' height='768' fill='url(#g)'/>
    <text x='50%' y='50%' fill='rgba(255,255,255,0.92)' font-family='Inter, system-ui, sans-serif'
      font-size='42' font-weight='600' text-anchor='middle' dominant-baseline='middle'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function fileNameFromPath(path: string): string {
  const base = path.split('/').pop() ?? path;
  return base.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
}

function buildSet(bundle: Record<string, string>): SamplePhoto[] {
  const fromBundle = Object.entries(bundle).map(([path, src]) => ({
    src,
    name: fileNameFromPath(path),
  }));
  // Empty folders (e.g. play/ before the user drops images in) fall back to
  // the gradient placeholders so the e-ink screen never goes blank.
  return fromBundle.length > 0 ? fromBundle : fallbackGradients;
}

export const samplePhotosByCategory: Record<SampleCategory, SamplePhoto[]> = {
  earn: buildSet(bundledEarn),
  play: buildSet(bundledPlay),
};

// Backwards-compatible default export — still points at the earn set so any
// callers that don't yet know about categories keep working.
export const samplePhotos: SamplePhoto[] = samplePhotosByCategory.earn;

export function pickRandomSample(category: SampleCategory = 'earn'): SamplePhoto {
  const set = samplePhotosByCategory[category];
  return set[Math.floor(Math.random() * set.length)];
}
