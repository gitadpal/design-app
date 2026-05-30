# Campaign Gallery — Design Spec

## Status

- **Branch:** `feature/campaign-gallery`
- **Phase:** Design locked. Ready for implementation in a fresh session.
- **Replaces:** `src/components/AdCampaigns.tsx` (the existing card-list campaigns surface).

## Goal

Replace the existing list-style campaigns page with a **zoomable gallery wall of collectible cards**. Each card represents a campaign. The card's image area is intentionally shaped to the e-ink screen's 5:7 / 11:16 aspect ratio, so it is a true 1:1 preview of what will display on the user's case.

The page should feel like walking through a randomly-curated gallery of premium digital collectibles — image-led, gesture-rich, hardware-honest. Premium fintech + Web3 register per `platform/ADPAL_BRAND_GUIDELINES.md`. **Never poker, never casino, never gamified-cartoonish.**

## Why this, not the alternatives

- **Current list (`AdCampaigns.tsx`)** is text-heavy and image-secondary. It doesn't carry the brand, doesn't leverage hardware-honesty, and feels inconsistent with the tactile Cast page.
- **Poker hand** was the original metaphor. Card-shape geometry is preserved because it's genuinely close to the e-ink (poker is 5:7 ≈ 0.714, e-ink is 11:16 ≈ 0.687). But poker chrome carries casino/gambling connotations the brand explicitly rejects. We keep the geometry; we drop the chrome and reframe as collectibles in a gallery.

## Core metaphor

**Cards as collectibles in a gallery you walk through.**

- The page is a 2D wall, not a list or a feed.
- Each campaign is a card with collectible identity (chrome, edition, chain affinity).
- A spotlight follows the viewport center — cards under it are lit; cards away from center dim.
- One card represents the campaign currently slotted into the user's case. That card has distinct visual treatment and always stays visible.
- Some campaigns are *series* (animated). The user picks one frame of the series to commit.
- Committing a card to the case is a press-and-hold gesture timed to a real NFC contact with the case.

## Card anatomy

Each card has these layers, outer to inner:

1. **Aura** — volumetric glow extending *beyond* the card body, in the chain's brand color. Intensity is proportional to relative payout. Card body stays Matte Obsidian; the aura is what carries the chain identity in space.
2. **Card body** — Matte Obsidian with subtle grain texture per brand spec. Rounded corners (~8px max — crisp, not soft).
3. **Image area** (top) — exact 5:7 / 11:16 aspect. True preview of what will display on the e-ink screen. **No overlays.**
4. **Stats strip** (bottom) — payout, duration, advertiser, edition. Content scales with zoom level (see Layout).
5. **Tail-tag** — a hung-tag at the lower-right corner showing the chain logo. Also the accessibility-redundant cue for the aura color.
6. **Trending overlay** — for tokens with significant recent positive movement, a restrained fire-like animation on the aura. Throttled to in-viewport cards only.
7. **Back face** — accessed by tap-while-zoomed-in. Shows full terms, advertiser bio, detailed stats. Flip animation = brand's fold/unfold style.

```
                                              
    aura (chain color,       ┌────────────────────┐
    intensity = payout)──→   │░░░░░░░░░░░░░░░░░░░░│
                             │░░░░░░░░░░░░░░░░░░░░│  image area
   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒    │░░░░░░░░░░░░░░░░░░░░│  = 5:7 / 11:16
   ▒▒                  ▒▒    │░░░░░░░░░░░░░░░░░░░░│  TRUE PREVIEW
   ▒▒  ┌────────────┐  ▒▒    │░░░░░░░░░░░░░░░░░░░░│
   ▒▒  │░░░░░░░░░░░░│  ▒▒    │░░░░░░░░░░░░░░░░░░░░│
   ▒▒  │░░░░░░░░░░░░│  ▒▒    │░░░░░░░░░░░░░░░░░░░░│
   ▒▒  │░░░░░░░░░░░░│  ▒▒ ◀──┤░░░░░░░░░░░░░░░░░░░░│  (chrome falls
   ▒▒  │░░░░░░░░░░░░│  ▒▒    │░░░░░░░░░░░░░░░░░░░░│   away on cast,
   ▒▒  │░░░░░░░░░░░░│  ▒▒    │░░░░░░░░░░░░░░░░░░░░│   only image
   ▒▒  ├────────────┤  ▒▒    ├────────────────────┤   transfers)
   ▒▒  │ 22 ◇/cast  │  ▒▒    │ 22 ◇/cast    7d ⏱  │
   ▒▒  │ Vitalik T  │  ▒▒    │ Vitalik T · #1/500 │  stats strip
   ▒▒  └─────┬──────┘  ▒▒    └──────────┬─────────┘
   ▒▒        │ETH      ▒▒               │
   ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒              ┌─┴─┐         tail-tag
                                       │ETH│         (chain glyph,
                                       └───┘          ~15° angled,
                                                      flips for edition)
```

## Layout

**Default zoom: 5 cards per row.** Three fully visible in the middle; two partially clipped at the left and right edges. Edge peeks are deliberate — they telegraph that the wall extends beyond the viewport. Vertical peeks at top/bottom rows do the same on the row axis.

Pan freely in both axes. Pinch to zoom — fewer cards = more chrome detail.

### Chrome scales with zoom

| Zoom | Cards per row | Visible chrome |
|---|---|---|
| Out | 5 (default) | Image + payout chip + tail-tag |
| Mid | 3 | Image + payout + duration + advertiser |
| In | 1–2 | Image + full stats + edition + flip affordance |

Text fades in with zoom. Never show text smaller than ~10pt rendered.

```
   5-wide (default)        3-wide (mid zoom)        1-2 wide (deep zoom)
┌──────┐                 ┌────────────┐            ┌──────────────────┐
│░░░░░░│                 │░░░░░░░░░░░░│            │░░░░░░░░░░░░░░░░░░│
│░ img │                 │░░░ img ░░░░│            │░░░░░  img  ░░░░░░│
│░░░░░░│                 │░░░░░░░░░░░░│            │░░░░░░░░░░░░░░░░░░│
│ 12◇  │                 │░░░░░░░░░░░░│            │░░░░░░░░░░░░░░░░░░│
└──┬───┘                 ├────────────┤            ├──────────────────┤
   │ETH                  │ 12◇    7d  │            │ 12 ◇/cast    7d ⏱│
                         │ Vitalik T  │            │ Vitalik Tee      │
                         └──────┬─────┘            │ #1 of 500 · rare │
                                │ETH               └─────────┬────────┘
                                                             │ETH ◆#1/500
```

## Gallery lighting

The viewport center is a **spotlight zone**. Cards under the spotlight are at full brightness, full color, full aura intensity. Cards away from center dim progressively — desaturated, lower contrast, aura attenuated. Falloff is radial from the screen center.

As the user pans, the spotlight stays fixed to the screen — different cards move *into* the lit zone and become bright; cards moving out fade down. This:

- Reinforces the gallery metaphor (museum spotlighting).
- Naturally directs attention to the central card without UI chrome.
- Lets us optimize rendering — only the lit ring needs full-fidelity aura/animation; off-center cards can use cheaper static renders.

```
┌──────────────────────────────────────────────┐
│ ┌─┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌─       │
│ │·│  │······│  │······│  │······│  │·       │ ← outer rows:
│ │·│  │··img·│  │··img·│▶ │··img·│  │·       │   dimmed,
│ │·│  │······│  │······│  │······│  │·       │   desaturated,
│ │·│  │ 12 . │  │  8 . │  │ 30 . │  │·       │   aura faint
│ └┬┘  └──┬───┘  └──┬───┘  └──┬───┘  └┬       │
│                                              │
│      ┄ ┄ ┄ ┄ ┄ ☀ spotlight ☀ ┄ ┄ ┄ ┄ ┄      │
│ ┌─┐  ┌──────┐  ╔══════╗  ┌──────┐  ┌─       │
│ │░│  │░░░░░░│  ║██████║  │░░░░░░│  │░       │ ← lit row,
│ │░│  │░ img │  ║█ img █║▶ │░ img │  │░       │   center card
│ │░│  │░░░░░░│  ║██████║  │░░░░░░│  │░       │   brightest of all
│ │░│  │ 22◇  │  ║◆ IN  ║  │  6◇  │  │░       │
│ └┬┘  └──┬───┘  ╚══╤═══╝  └──┬───┘  └┬       │
│      ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄      │
│                                              │
│ ┌─┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌─       │
│ │·│  │······│  │······│  │······│  │·       │ ← outer rows
│ │·│  │··img·│  │··img·│  │··img·│  │·       │   dimmed
│ │·│  │······│  │······│  │······│  │·       │
│ └┬┘  └──┬───┘  └──┬───┘  └──┬───┘  └┬       │
└──────────────────────────────────────────────┘
```

**The slotted card is an exception** — it carries its own halo and never fully dims, even when panned out of the spotlight. The case is always "lit."

## Currently-slotted card

The campaign currently displayed on the user's case has a distinct treatment:

- **Foil rim** in the Prism Gradient (Cyber Mint → Electric Violet).
- **◆ IN CASE** marker in the stats strip — replaces the payout chip (payout is implicit / not currently relevant since the card is active).
- **Slot tail-tag** in addition to the chain tail-tag. Lower-right has two tags: chain on the left, `◆` slot pip on the right.
- **Persistent spotlight halo** behind it — reads as "lit" regardless of pan position.
- **Always present** in the wall, even after reshuffle. The wall doesn't get to lose your active campaign.

```
              ╔════════════════════╗
              ║░░░░░░░░░░░░░░░░░░░░║
     prism    ║░░░░░░░░░░░░░░░░░░░░║
     foil ◀──╫░░░░░░ img ░░░░░░░░░║   ← image area =
     rim     ║░░░░░░░░░░░░░░░░░░░░║      true case preview
              ║░░░░░░░░░░░░░░░░░░░░║
              ╠════════════════════╣
              ║ ◆ IN CASE          ║   ← banner replaces
              ║ Vitalik Tee        ║      payout info
              ║ slotted 2d 14h ago ║
              ╚══╤══════════════╤══╝
                 │              │
                ┌┴─┐          ┌─┴─┐
                │ETH│          │◆ │       ← chain tag +
                └──┘          └───┘          slot pip
                                              (two tags)
              ☀ persistent spotlight halo
              (lit even when off-center)
```

## Animated series

Some campaigns are **series**: a sequence of N frames, each frame with its own payout. The user picks **one frame** to commit. This turns the e-ink hardware constraint (can't animate) into a user-agency moment (you capture a still from the motion).

### Behavior in wall view

- Animated cards auto-play their series in place while in the lit zone.
- A `▶` marker on the card affords "this card has multiple frames."
- Off-center / dim cards do not animate (performance + visual quiet).

### Scrub view (on tap / zoom-in)

- Wall blurs behind. The card centers and enlarges with full chrome.
- Auto-play stops. A **scrub strip** appears below the card.
- One thumb per frame; drag to move the active frame.
- A **payout sparkline** sits under the strip: bar height per frame = that frame's payout. Lets users see the payout peak across the series at a glance and aim for it.
- Per-frame stats update *inside* the card as the scrub moves (payout, rarity, edition).
- **Shuffle button (↺)** — cycles which frame is currently displayed. For users who want lean-back ("re-roll") rather than lean-in (deliberate scrub). Two paths to the same decision.
- Commit affordance: "press & hold to cast this frame."

```
┌──────────────────────────────────────────┐
│  ← back to wall                          │
│                                          │
│   ░ ░ ░ ░ ░ wall blurred ░ ░ ░ ░ ░       │
│                                          │
│         ┌────────────────────┐           │
│         │░░░░frame 3 of 12░░░│           │
│         │░░░░░░░░░░░░░░░░░░░░│           │
│         │░░░░░░░░░░░░░░░░░░░░│           │
│         ├────────────────────┤           │
│         │ 18 ◇/cast  ★ rare  │ ← updates │
│         │ Vitalik T · frame#3│   per frame│
│         └──────────┬─────────┘           │
│                    │ETH                   │
│                                          │
│   ┌─┬─┬█┬─┬─┬─┬─┬─┬─┬─┬─┬─┐             │ ← scrub strip
│   │·│·│▓│·│·│·│·│·│·│·│·│·│              │   thumb = active
│   └─┴─┴┬┴─┴─┴─┴─┴─┴─┴─┴─┴─┘             │
│   ┃ ┃ █ ┃ ┃ ┃ ▆ ┃ ┃ ▇ ┃ ┃               │ ← payout sparkline
│                                          │
│        ◀ drag       ↺ shuffle            │
│            ━━━ press & hold ━━━          │ ← commit
└──────────────────────────────────────────┘
```

## Cast sequence

The cast gesture is **press-and-hold-then-release-on-NFC**. Drag would be a UI gesture; hold-until-handshake-then-release is *the physical motion* of pressing a card against the case. Finger and case sync to the same real-world event.

Four beats:

| Beat | Time | What happens |
|---|---|---|
| **A. Press starts** | 0–~200ms | Touchdown registered. No commitment yet. Releasing here cancels cleanly. |
| **B. Hold building** | ~200–800ms | Card scales up, chrome dims away (image area remains), aura intensifies. Haptic pulse at ~600ms = "committed." Releasing before this point still cancels. |
| **C. NFC ready** | ~800ms+ | Background dims to a dithered preview of the exact image about to transfer. NFC prompt: "Tap your case now." User keeps holding while bringing phone to case. |
| **D. Released on contact** | NFC handshake fires | Image "irons" onto a rendered case e-ink screen with refresh ripples. Haptic confirm. Card animates into the slotted position. |

**Key invariant:** release timing is synchronized to the **physical NFC contact**, not to an arbitrary on-screen beat. This is rhythmic timing matching a real-world event, not a reflex test. Stays on the right side of the brand line (premium, not arcade).

```
   A. Press starts            B. Hold ~600ms           C. NFC ready             D. Released on contact
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│                     │  │                     │  │                     │  │                     │
│  ┌────────┐         │  │   ┌──────────┐      │  │  ░░░░░░░░░░░░░░░░░  │  │  ░░░░░░░░░░░░░░░░░  │
│  │░░░░░░░░│         │  │   │░░░░░░░░░░│      │  │  ░  ┌──────────┐ ░  │  │  ░  ┌──────────┐ ░  │
│  │░ img  ░│         │  │   │░ img    ░│      │  │  ░  │▒▒▒▒▒▒▒▒▒▒│ ░  │  │  ░  │  ╭───╮   │ ░  │
│  │░░░░░░░░│         │  │   │░ aura   ░│      │  │  ░  │▒dither  ▒│ ░  │  │  ░  │ │ ╱ │  │ ░  │
│  ├────────┤         │  │   │░ swells ░│      │  │  ░  │▒preview ▒│ ░  │  │  ░  │ │╱  │  │ ░  │
│  │ 22 ◇   │         │  │   │░ chrome ░│      │  │  ░  │▒▒▒▒▒▒▒▒▒▒│ ░  │  │  ░  │ ╰───╯  │ ░  │
│  └────┬───┘         │  │   │░ fading ░│      │  │  ░  └──────────┘ ░  │  │  ░  └────────┘  ░  │
│       │ETH          │  │   │░░░░░░░░░░│      │  │  ░    ◉ tap your   ░│  │  ░  on case e-ink ░  │
│                     │  │   └──────────┘      │  │  ░    case now      ░│  │  ░  ↓ ironed in   ░  │
│      •  ← finger    │  │       •  finger     │  │  ░░░░░░░░░░░░░░░░░  │  │  ░░░░░░░░░░░░░░░░░  │
│                     │  │   (haptic pulse)    │  │                     │  │                     │
│  rest of wall       │  │   rest dims         │  │  •  finger still    │  │  ✓ released         │
│  visible            │  │                     │  │     holding         │  │  haptic ✓ done      │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘
   touchdown               commitment building       NFC handshake fires        e-ink refresh
   no commitment yet       release here = abort      release HERE = cast        ripple, then settle
```

The dithered preview (beat C) is honest hardware: the user sees exactly what the case will show before committing.

## Interactions catalog

| Gesture | Effect |
|---|---|
| Pan (drag) | Move viewport across the wall (both axes) |
| Pinch out | Zoom out: more cards, less chrome |
| Pinch in | Zoom in: fewer cards, more chrome |
| Tap on card | Zoom in to single-card view (animated → scrub; static → details) |
| Tap inside open card | Flip to back face (full terms) |
| Drag scrub strip | Move active frame in an animated series |
| ↺ Shuffle | Cycle current frame (animated cards only) |
| Press-and-hold on open card | Begin cast sequence |
| Release during press | Cancel (if before haptic) / cast (if NFC contact) |
| Reshuffle button | New random batch of campaigns |
| ← back affordance | Return zoomed-in view to wall |

**Note:** pull-to-reshuffle as a gesture conflicts with 2D pan. Use an explicit `↺` button in the header instead.

## State catalog

1. **Default wall** — 5-per-row, spotlight at viewport center, mixed static + animated cards, slotted card always present and self-lit.
2. **Zoomed-in static card** — wall blurred behind, single card centered with full chrome, tap to flip.
3. **Zoomed-in animated card (scrub mode)** — as above + scrub strip + sparkline + shuffle.
4. **Cast sequence** — 4 beats as above.
5. **Reshuffled wall** — same layout, new random batch. Animation: cards fade out, new cards cascade in.
6. **Empty** — slotted card alone if any, plus "the gallery is quiet" message + ↺ reshuffle.
7. **Loading** — 5-per-row skeleton, Prism shimmer sweeping L→R every ~1.2s.
8. **Reduced-motion fallback** — vertical single-column list of cards, no wall, no flip, tap to expand inline.

## Brand fit checklist

Run against `platform/ADPAL_BRAND_GUIDELINES.md`:

- ✅ No casino/gambling chrome (no suits, no chips, no felt, no spinning wheels)
- ✅ Premium fintech register (museum + collectibles, not toy)
- ✅ Matte Obsidian base + Prism Gradient as accent (foil rims, loading sweep, slotted treatment)
- ✅ Crisp animations (fold/unfold, glint) — no floaty/slow
- ✅ Glassmorphism used selectively (slotted treatment, balance display)
- ✅ Hardware-honest (image area = 1:1 case preview, dithered preview before commit)
- ✅ Web3-native cues (chain-color auras, edition numbers, holo-style foil, no gambling)

## Implementation pointers

### Files to read first

- `src/components/AdCampaigns.tsx` — current campaigns surface. Read for data shape (`Campaign`, `castImageUrl`, `tokensPerCast`, `totalTokenPool`, status enum) but expect to replace, not extend.
- `src/components/ImageCasting.tsx` — best reference for gesture-rich, peek-style carousel work already in this codebase. Uses `motion/react`, has a clear pattern for derived position math (see `slotOf`, `cyclicIdx`, `PeekItem`).
- `src/styles/globals.css` — design tokens (`gradient-primary`, `glass-effect`, `glow-primary`, `text-gradient-primary`, etc.). All CSS-based — there is no `tailwind.config.js`.
- `client/CLAUDE.md` and root `CLAUDE.md` — stack and conventions.
- `platform/ADPAL_BRAND_GUIDELINES.md` — brand spec (lives in `platform/` but applies cross-app).

### Stack reminders

- React 18 + Vite 6 + TS
- Tailwind CSS v4 via `@tailwindcss/vite` (CSS-based config)
- `motion/react` for animations
- `lucide-react` icons
- `shadcn/ui` in `src/components/ui/`
- Path alias `@` → `src/`
- Versioned package aliases in `vite.config.ts` (e.g., `sonner@2.0.3` → `sonner`) — match this pattern for new imports

### Suggested decomposition

```
src/components/CampaignGallery/
  CampaignGallery.tsx          // top-level: viewport, pan/zoom, lighting, reshuffle
  WallGrid.tsx                 // virtualized 2D grid of cards
  CampaignCard.tsx             // the card itself, zoom-aware chrome
  CardAura.tsx                 // chain-colored volumetric glow
  CardZoomView.tsx             // opened single-card view + flip
  ScrubStrip.tsx               // animated-series frame scrubber + sparkline
  CastSequence.tsx             // press-and-hold → NFC → e-ink ironing
  SlottedHighlight.tsx         // overlay treatment for currently-slotted

src/hooks/
  useWallPanZoom.ts            // gesture state, viewport math
  useSpotlightFalloff.ts       // per-card brightness given pan center
  useNfcCastHold.ts            // 4-beat cast state machine

src/utils/
  dithering.ts                 // port/borrow from platform for cast preview
  chainColors.ts               // chain → aura color, logo, etc.
```

### Performance budget

- 60fps pan/zoom with ~30 cards in the wall.
- Max 4 animated cards playing simultaneously — only those near the spotlight center.
- Aggressive viewport culling. Off-screen cards render as static low-fidelity tiles or unmount.
- Auras as CSS box-shadows / radial gradients rather than canvas/WebGL where possible.

## Open decisions for implementation

1. **Lighting falloff curve** — linear, gaussian, or step? Gaussian feels best; step is cheapest. Start with linear, profile, decide.
2. **Reshuffle UX** — Discard? Animate out? Cascade in? Recommend: cards fade out top-to-bottom in ~200ms, new cards cascade in with staggered fade-in.
3. **Wall density** — recommend constant batch size (~24 cards) for predictable performance. Confirm.
4. **Frame-pick lock-in** — once a frame is cast, is that user's permanent frame for that campaign, or can they re-pick on next cast? Affects mock-data shape and "shuffle" semantics post-cast.
5. **NFC stub** — no real NFC integration available. Need a dev-mode stub that simulates the contact moment (e.g., tap-and-hold for X seconds → "fire NFC contact" button). Real NFC is out of scope.
6. **Dithering preview source** — client-side dithering before NFC fires (honest, slight latency) vs. case-driven preview after handshake (zero client compute, but feels late). Recommend client-side.
7. **Accessibility second pass** — concrete focus order, reduced-motion fallback details, screen reader behavior in scrub mode.

## Out of scope

- Real NFC hardware integration (stub only).
- Advertiser-side authoring of animated series (assumed to come from mock-data).
- Server-side gallery curation (random batch is a client-side selection from mock data).
- Real payout / earnings recalc (mock numbers only).
- Routing / deep-linking to specific cards (campaign data is randomly batched).

## Continuation prompt for fresh session

> Read `client/CAMPAIGN_GALLERY_DESIGN.md` end to end. You're on branch `feature/campaign-gallery`. Begin implementing the Campaign Gallery as specified. Start with the wall layout, card anatomy at 5-per-row, and pan/zoom — defer animated series, cast sequence, and dithering preview to later passes. Use `motion/react` and existing design tokens in `src/styles/globals.css`. Reference `src/components/ImageCasting.tsx` for gesture and peek-positioning patterns. Don't extend `AdCampaigns.tsx` — build the new component tree in `src/components/CampaignGallery/`.
