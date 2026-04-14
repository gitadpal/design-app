# Snapshot Script

Captures screenshots of the client app at multiple device resolutions using Puppeteer.

## Prerequisites

- Dev server running: `npm run dev` (port 3000)
- Chrome/Chromium installed locally
- `puppeteer-core` (already in devDependencies)

## Usage

```bash
node snapshot.mjs
```

Output goes to `snapshot/<width>x<height>/` (gitignored).

## How it works

The script uses **hash-based deep linking** built into `App.tsx` via `getHashNav()`. When the app loads with a URL hash like `#/campaign-detail/1`, it initializes React state to show that page directly — no clicking or navigation needed.

**This requires the hash navigation code in `App.tsx`.** If it has been removed, re-add the `getHashNav()` function and wire it into the initial `useState` calls. The pattern is:

```tsx
function getHashNav() {
  const hash = window.location.hash;
  if (!hash || hash === '#/') return null;
  const parts = hash.replace('#/', '').split('/');
  return { page: parts[0], param: parts[1] };
}
```

Then use `h = getHashNav()` to set initial values for `activeTab`, `adView`, `selectedCampaignId`, `einkCaseAttached`, and `walletConnected` based on the hash page.

## Pages captured

| Name | Hash | Notes |
|------|------|-------|
| `earnings` | _(none)_ | Default view, tab: ads |
| `cast` | `#/cast` | Cast tab |
| `assets` | `#/assets` | Assets tab, needs `walletConnected=true` |
| `campaign-detail` | `#/campaign-detail/1` | Needs `einkCaseAttached=true` and a valid campaign ID |
| `cast-preview` | `#/cast-preview/1` | Needs `einkCaseAttached=true` and a valid campaign ID |

## Resolutions

| Size | Device |
|------|--------|
| 1260x2736 | iPhone 15 Pro Max |
| 1242x2688 | iPhone XS Max / 11 Pro Max |
| 1206x2622 | iPhone 14 Pro |
| 1125x2436 | iPhone X / 11 / 12 / 13 |
| 1242x2208 | iPhone 6/7/8 Plus |
| 2064x2752 | iPad |

## Adding new pages

1. Add a hash route in `App.tsx`'s `getHashNav()` state wiring
2. Add an entry to the `PAGES` array in `snapshot.mjs`
3. If the page requires specific state (e.g. `walletConnected`), set defaults in the `useState` initializers

## Adding new resolutions

Add a `[width, height]` entry to the `SIZES` array in `snapshot.mjs`.
