const bundled = import.meta.glob(
  '../../assets/onboarding-samples/*.{png,jpg,jpeg,webp,gif}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

export interface SamplePhoto {
  src: string;
  name: string;
}

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

export const samplePhotos: SamplePhoto[] = (() => {
  const fromBundle = Object.entries(bundled).map(([path, src]) => ({
    src,
    name: fileNameFromPath(path),
  }));
  return fromBundle.length > 0 ? fromBundle : fallbackGradients;
})();

export function pickRandomSample(): SamplePhoto {
  return samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
}
