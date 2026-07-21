# Circle — Private P2P Casting

Design spec for the Circle feature in the client app. Confirmed via design discussion on 2026-07-16. All ASCII mocks are ~44 chars wide to reflect the 448px mobile viewport.

## Overview

Circle adds a private, tip-driven social layer on top of the existing e-ink casting pipeline. Users can:

- Add friends by random scoped handle (no fuzzy search, no discoverability by name)
- Send images as "gifts" with any user-owned token attached — tips transfer irrevocably; casting the image is optional for the recipient
- Subscribe to creators (free or paid) — new posts arrive as notifications and are manually pulled into the cast queue, never auto-cast
- Generate personal e-ink renders from local sources (calendar first; weather / todos / health rings later, via the same renderer interface)

Circle respects existing revenue flows: everything Circle-related hides while an ad campaign is actively being cast.

## Scope

**In scope for this feature:**

- Circle tab (friends, subs, own handle + QR)
- Subscription detail page
- Circle queue browser (swipe carousel)
- Tip composer + token picker modal
- Cast tab additions (top-bar entry button, ribbon-marked Featured tiles, `Subs` gallery tab)
- Calendar renderer under Assets
- Add friend page (scan / paste)
- Settings additions for Circle, subs, renderers, notifications, privacy

**Deferred (not this pass):**

- Discover shelf for finding new subscriptions (relying on friend forwards + QR + invite links initially)
- Swipe-interaction fine-tuning (velocity thresholds, haptics, undo toast for dismiss)
- Paid-sub billing edge cases (renewal reminder, insufficient balance, cancel confirmation)
- Empty states and first-time onboarding
- Multi-chain support in the token picker (single-chain / Base default for now)
- Backend transport, storage, and delivery infrastructure

## Locked design decisions

- **Feature is frontend-only.** Storage, transport, delivery routing, and read receipts are backend concerns not covered here. UI assumes the underlying messaging layer provides `sent → delivered → opened` states.

- **Friend handle format: `word-word#nnnn`.** Two-word hyphenated name plus a 4-digit discriminator, randomly generated and assigned. Not user-chosen. Roughly `10^10` handle space. Prevents impersonation and land-grab problems. Users can attach a per-friend remark (nickname) shown alongside the handle in their own UI only.

- **No fuzzy search anywhere.** Discovery is via friend forwards, QR codes, and out-of-band invite links. Search inputs accept exact handles only. Rationale: strangers should not be able to reach a user by name — the whole trust model of the tip-then-cast flow depends on this.

- **Tips are decoupled from casting.** When Alice sends a token + image to Bob, the tokens transfer immediately and irrevocably. Bob can accept the tokens and dismiss the image; the tokens are his either way. This makes the tip a real gift, not a coercion to display. Without decoupling, Bob would be pressured into displaying whatever a friend sent to keep the money, which opens a griefing vector.

- **Sub content is notification + manual pull, never auto-cast.** Casting to the e-ink case is already a manual physical action; automating one part of the flow would just create surprises. Sub posts arrive as notifications and queue up in the Circle queue for the user to pull when they want.

- **Subscription tiers: free / paid.** Once subscribed, the recurring price is not shown in the UI (avoids the "you're spending money" nag). Billing supported by SiXPay for both monthly auto-renew and per-post micropayments.

- **Any user-owned token can be tipped.** No dedicated tip currency. Tip composer surfaces a token picker (see design ⑤) so the sender picks per-tip.

- **Circle accent color: amber `#f59e0b`.** Distinct from the four existing tab colors (Earnings emerald `#22c55e`, Cast rose `#f43f5e`, Assets electric violet `#BC13FE`, Settings cyan `#06b6d4`). Amber carries a warm "gift / value" association and completes a warm-to-cool spectrum across the nav bar.

- **Cast tab additions are conditional on `activeCommitment == null`.** During an active ad campaign, the Circle-queue entry button in the top bar hides, and the two Circle-sourced ribbon tiles in the Featured grid hide. Everything else in the existing Cast layout is untouched.

- **The IN QUEUE / IN CAST semantics from the Campaigns top bar do not apply to Cast.** Cast's minimal glass top bar exists solely to host the Circle-queue entry button on the right; the left and center slots are empty. IN CAST is meaningful only for campaigns.

- **Calendar preview is rendered in the actual e-ink display aspect (528×768 portrait).** Agenda-list layout inside that canvas, not a wide-week grid — vertical space is what's abundant.

## Design tokens

- **Circle accent (primary):** `#f59e0b` (Tailwind `amber-500`)
- **Circle inactive text (nav):** suggest `text-amber-400` to match the existing pattern (`text-emerald-400`, `text-rose-400`, etc.)
- **Currently-cast frame:** existing mint `#00FFC2` — unchanged, still means "on the case right now"
- **Ribbon color for Circle-sourced tiles:** amber `#f59e0b` regardless of subtype (gift / sub / calendar)
- **Nav halo pattern:** inherit the existing "rotated radial fingerprint" from other tabs; tint amber

## Navigation

Bottom nav order becomes: **Earn · Cast · Circle · Assets · Settings.** Circle is inserted between Cast and Assets — social is casting-adjacent, and Assets remains the personal storage / renderer surface.

Sub-navigation within the feature (single-app, no router — mirror the existing `App.tsx` view-state lifting pattern):

- Circle tab
  - `main` — friends + subs list (design ①)
  - `subscription-detail` — single sub's post grid (design ②)
  - `add-friend` — scan / paste (design ⑦)
  - `tip-composer` — send-a-gift flow (design ⑤)
- Cast tab (existing)
  - additions integrated in place (design ③)
  - `circle-queue-browser` — swipe carousel (design ④)
- Assets tab (existing)
  - `calendar-renderer` — new sub-view (design ⑥)
- Settings tab (existing)
  - additions integrated in place (design ⑧)

## Data model shape

Sketch only — refine at build time.

```ts
interface Friend {
  handle: string;          // `word-word#nnnn`, immutable
  displayName?: string;    // per-user remark, local only
  avatarUrl?: string;
  walletAddress: string;   // for tip routing
  addedAt: Date;
}

interface Subscription {
  creatorHandle: string;
  title: string;
  tagline?: string;
  coverUrl: string;
  tier: 'free' | 'paid';
  // Recurring price intentionally not surfaced once subscribed;
  // fetched for billing screens only.
  subscribedAt: Date;
  unreadCount: number;
}

interface SubPost {
  id: string;
  creatorHandle: string;
  imageUrl: string;        // full-res source
  previewUrl: string;      // e-ink dithered preview
  publishedAt: Date;
  isPulled: boolean;       // false until user pulls it into queue
  isPaidGated: boolean;    // if true and !isPulled, blur in gallery
}

interface Gift {
  id: string;
  fromHandle: string;
  imageUrl: string;
  previewUrl: string;
  tokenSymbol: string;
  tokenAmount: string;     // string for precision
  chain: string;           // 'base' default
  note?: string;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
}

interface CalendarRender {
  view: 'week' | 'month';
  rangeStart: Date;
  rangeEnd: Date;
  stylePreset: 'minimal' | 'art-deco' | 'hand-drawn';
  sourceCalendarIds: string[];
  imageUrl: string;        // final 528×768 dithered PNG
  refreshedAt: Date;
}

interface QueueItem {
  source: 'gift' | 'sub' | 'calendar';
  ref: Gift | SubPost | CalendarRender;
  arrivedAt: Date;
  dismissed: boolean;
}
```

## Screens

Nine screen designs. Ordered by feature area.

---

### ① Circle tab — main hub

Friend cards use the same portrait aspect (`aspect-[5/7]`) as the existing gallery tile grid so the two feel like the same visual family. Remark (nickname) renders in quotes below the handle. `↑/↓` and `● new gift` badges surface interaction hints without opening a detail view.

Subscriptions render as visually-stacked card decks — the `┘┘┘` in ASCII represents 2–3 offset cards behind the front card, communicating "there are unread posts inside." Tap enters the subscription detail (design ②), which unstacks the deck into a flat grid.

```
╭──────────────────────────────────────────╮
│                                          │
│  ⚭ CIRCLE                            ⋯   │
│                                          │
│  your handle                             │
│  fern-quill#4821            [ Share QR ] │
│  ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈       │
├──────────────────────────────────────────┤
│                                          │
│  Friends  (7)                     + Add  │
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │
│  │              │  │              │      │
│  │    ◉ avi     │  │    ◉ avi     │      │
│  │              │  │              │      │
│  │ moss-harbor  │  │ river-lens   │      │
│  │ #9182        │  │ #2044        │      │
│  │ "Alex"       │  │              │      │
│  │              │  │              │      │
│  │ sent 3  ↑    │  │ recv 1  ↓    │      │
│  └──────────────┘  └──────────────┘      │
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │
│  │              │  │              │      │
│  │    ◉ avi     │  │    ◉ avi     │      │
│  │              │  │              │      │
│  │ petal-dune   │  │ amber-loop   │      │
│  │ #5563        │  │ #6620        │      │
│  │ "Sam"        │  │              │      │
│  │              │  │              │      │
│  │ ● new gift   │  │              │      │
│  └──────────────┘  └──────────────┘      │
│                                          │
│  Subscriptions  (2)                      │
│                                          │
│   ┌────────────┐┐┐   ┌────────────┐┐┐    │
│   │            │││   │            │││    │
│   │    ⧫       │││   │    ⧫       │││    │
│   │            │││   │            │││    │
│   │ fortune-   │││   │ slow-      │││    │
│   │ quill      │││   │ wall       │││    │
│   │            │││   │            │││    │
│   │ Daily      │││   │ Wallpapers │││    │
│   │ fortune    │││   │            │││    │
│   │            │││   │            │││    │
│   │ ✦ Paid     │││   │ Free       │││    │
│   │ ● 1 new    │││   │ ● 3 new    │││    │
│   └────────────┘┘┘   └────────────┘┘┘    │
│                                          │
├──────────────────────────────────────────┤
│  💰    📡    ◉    📁    ⚙                 │
│ Earn  Cast Circle Asst Set               │
╰──────────────────────────────────────────╯
```

Handle row: primary CTA is `Share QR` — opens a QR sheet with the handle text below for copy/paste.

Tap `+ Add` → design ⑦.

Tap a friend card → tip composer preloaded with that friend selected (design ⑤).

Tap a sub deck → design ②.

---

### ② Subscription detail

Deck unstacks into a flat grid on entry. Header shows creator identity, subscription tier (paid subs show `✦ Paid` — no recurring price), and a `Manage subscription` entry point (cancels, tier changes handled through settings).

Post grid uses the same portrait tile shape as everywhere else. Unpulled paid posts get a blur treatment (see design ③ / ribbon behavior). Tap a post → jumps into the Circle queue browser (design ④) preloaded on that post.

```
╭──────────────────────────────────────────╮
│  ←  fortune-quill                        │
├──────────────────────────────────────────┤
│                                          │
│         ┌──────────────┐                 │
│         │              │                 │
│         │      ⧫       │                 │
│         │              │                 │
│         └──────────────┘                 │
│                                          │
│         fortune-quill#0733               │
│         Daily fortune                    │
│                                          │
│         ✦ Subscribed · Paid              │
│                                          │
│    "One card a day, drawn at dawn.       │
│     Read it slow."                       │
│                                          │
│      [ Manage subscription ]             │
│                                          │
│  ────────────────────────────────────    │
│                                          │
│  Posts  (24)                             │
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │
│  │  ● new       │  │              │      │
│  │              │  │              │      │
│  │   preview    │  │   preview    │      │
│  │              │  │              │      │
│  │  Jul 16      │  │  Jul 15      │      │
│  └──────────────┘  └──────────────┘      │
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │
│  │              │  │              │      │
│  │   preview    │  │   preview    │      │
│  │              │  │              │      │
│  │  Jul 14      │  │  Jul 13      │      │
│  └──────────────┘  └──────────────┘      │
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │
│  │   preview    │  │   preview    │      │
│  │              │  │              │      │
│  │  Jul 12      │  │  Jul 11      │      │
│  └──────────────┘  └──────────────┘      │
│                                          │
╰──────────────────────────────────────────╯
```

---

### ③ Cast tab — additions

Everything about the existing Cast page layout (Quick Cast → Recent Casting → gallery tabs → 2-col grid) is untouched. The additions:

**Minimal glass top bar** — new. Right-anchored circular button in amber with an unread badge. This is the Circle-queue entry point; it replaces the position where Campaigns has its history clock. Left and center slots are empty (IN QUEUE / IN CAST semantics do not apply on Cast). Bar itself is a thin glass surface for visual consistency with Campaigns' top bar; it exists solely to host this button.

**Featured tab, first two tiles** — new. The latest two items in the Circle queue are inserted at the top of the Featured grid with an amber corner ribbon. The ribbon icon disambiguates subtype:

- `▛🎁` — gift from a friend
- `▛⧫` — subscription post
- `▛📅` — personal renderer output (calendar)

Attribution (`@handle` or "This week") replaces the usual title in the bottom gradient strip. Paid sub posts that have not been pulled get a blur treatment on the preview (creates curiosity, matches the "pull to reveal" concept from ⑤).

**Tap behavior on a ribbon tile** — jumps into the Circle queue browser (design ④) preloaded on that item. Uniform interaction language with the queue browser itself; ribbon tiles feel like real Circle content, not "regular tiles with a sticker."

**New `⧫ Subs` gallery tab** — appended to the existing horizontal tab strip after Featured. Shows recent posts from all subscribed creators in chronological order. Same 2-col portrait grid as other tabs, same paid-post blur behavior.

**Hides during active campaign** — both the top-bar button and the two ribbon tiles disappear entirely when `activeCommitment != null`. The existing "Active Campaign" status card, dimmed carousel, and dimmed gallery all behave exactly as they do today. Circle remains reachable via the Circle tab in the bottom nav.

```
╭──────────────────────────────────────────╮
│                                          │
│                                 ┌─────┐  │  ← NEW glass top bar
│                                 │◉ ●2 │  │     Circle queue button
│                                 └─────┘  │     amber, badge = unread
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  Quick Cast                              │  ← UNCHANGED
│  ┌──────────────┐  ┌──────────────┐      │
│  │              │  │              │      │
│  │     📷       │  │     📤       │      │
│  │              │  │              │      │
│  │  Take Photo  │  │   Upload     │      │
│  └──────────────┘  └──────────────┘      │
│                                          │
│  Recent Casting                          │  ← UNCHANGED
│    ╭────────────────────╮                │
│    │  ┌──────────────┐  │                │
│    │  │              │  │                │
│    │  │ case screen  │  │                │
│    │  │              │  │                │
│    │  └──────────────┘  │                │
│    ╰────────────────────╯                │
│          Featured                        │
│          ○ ● ○ ○ ○                       │
│                                          │
│ ‹[✧ Featured] ⧫ Subs 🐾 Animals ›       │  ← Subs tab added
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │  ← 1st 2 tiles: Circle
│  │▛🎁            │  │▛⧫            │      │     amber corner ribbon
│  │              │  │              │      │
│  │              │  │              │      │
│  │   preview    │  │   preview    │      │
│  │              │  │              │      │
│  │              │  │              │      │
│  │              │  │              │      │
│  │ @petal-dune  │  │ @fortune-q…  │      │
│  └──────────────┘  └──────────────┘      │
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │  ← rest: regular Featured
│  │              │  │              │      │
│  │              │  │              │      │
│  │   preview    │  │   preview    │      │
│  │              │  │              │      │
│  │  Mountain    │  │  Aurora      │      │
│  └──────────────┘  └──────────────┘      │
│                                          │
├──────────────────────────────────────────┤
│  💰    📡    ◉    📁    ⚙                 │
╰──────────────────────────────────────────╯
```

---

### ④ Circle queue browser

Full-screen card carousel. One item per card at a time; page dots below the card indicate position in the queue. Preview canvas is the actual e-ink display aspect (528×768 portrait) so what the user sees on the card is what will land on the case.

**Gestures:**

- Swipe left / right — browse to next / previous item in the queue
- Swipe up — dismiss the current item (removes from queue; tokens from a gift stay in wallet — surface a toast confirming this on dismiss)
- Tap card — cast the current image to the case immediately

Card content is the same for all three subtypes (gift, sub post, calendar render); source-specific header line and metadata swap in. Gift example:

```
╭──────────────────────────────────────────╮
│  ←  Circle queue                1 of 5   │
├──────────────────────────────────────────┤
│                                          │
│                                          │
│    ╭──────────────────────────╮          │
│    │  🎁 from @petal-dune     │          │
│    │  #5563 "Sam"       2h    │          │
│    │  ─────────────────────   │          │
│    │  ┌────────────────────┐  │          │
│    │  │                    │  │          │
│    │  │                    │  │          │
│    │  │                    │  │          │
│    │  │   e-ink preview    │  │          │
│    │  │   528 × 768        │  │          │
│    │  │                    │  │          │
│    │  │                    │  │          │
│    │  │                    │  │          │
│    │  │                    │  │          │
│    │  └────────────────────┘  │          │
│    │                          │          │
│    │  +10 USDC · credited     │          │
│    │  "for your desk :)"      │          │
│    ╰──────────────────────────╯          │
│                                          │
│         ● ○ ○ ○ ○                        │
│                                          │
│                                          │
│    ← swipe          swipe →              │
│           ↑ dismiss                      │
│           tap: cast                      │
│                                          │
╰──────────────────────────────────────────╯
```

Peer cards visible at the horizontal edges when browsing (stack indicator) — establishes the sense of a queue rather than a single card.

Sub post card variant: header `⧫ from @fortune-quill · Today's fortune`; footer shows post publish time; for paid unpulled posts, the preview starts blurred and a `[ Pull ]` button overlays the card — after pull the blur fades and the card becomes castable.

Calendar render card variant: header `📅 This week · calendar`; footer shows `Refreshed 1h ago` and a `[ Restyle ]` chip.

---

### ⑤ Tip composer + token picker

Composer is a full-page flow reached from a friend card in the Circle tab (or via a `+ Tip` action elsewhere). Fields in order: Image → Token → Amount → Note.

```
╭──────────────────────────────────────────╮
│  ×   Send to @moss-harbor#9182 "Alex"    │
├──────────────────────────────────────────┤
│                                          │
│  Image                                   │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │        [ Pick from Assets ]        │  │
│  │        or drop file / camera       │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Token                                   │
│  ┌────────────────────────────────────┐  │
│  │  ◉  USDC · Base              ›    │  │
│  │     Balance 248.32                 │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Amount                                  │
│  ┌────────────────────────────────────┐  │
│  │  10.00                       USDC  │  │
│  └────────────────────────────────────┘  │
│  ≈ $10.00        [ 25% ][ 50% ][ Max ]   │
│                                          │
│  Note (optional)                         │
│  ┌────────────────────────────────────┐  │
│  │  for your desk :)                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │           Send gift  →             │  │
│  └────────────────────────────────────┘  │
│                                          │
╰──────────────────────────────────────────╯
```

Tapping the Token row opens the picker modal — pattern derived from sixpay's `AssetSelectorModal` (see `/Users/jax/Projects/sixpay/zct-cl-proj/apps/sixpay/src/app/components/merchant/AssetSelectorModal.tsx`), adapted with balances shown per row (sixpay's balance-bearing variant in `DepositApp.tsx`).

Modal shape: centered card over `bg-black/50 backdrop-blur-sm` overlay, `max-w-md`, `rounded-2xl`. Skips sixpay's Select-Network step — default single-chain (Base) until multi-chain becomes a real requirement. Row anatomy: 32px round token icon, `SYMBOL` bold left / balance right, `Name · Chain` muted below.

```
╭──────────────────────────────────────────╮
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░ ┌──────────────────────────────────┐ ░│
│░░ │  ←  Select token             ×  │ ░│
│░░ ├──────────────────────────────────┤ ░│
│░░ │  🔍 Search tokens…               │ ░│
│░░ ├──────────────────────────────────┤ ░│
│░░ │  ◉  USDC             248.32 USDC │ ░│
│░░ │     USD Coin · Base              │ ░│
│░░ │                                  │ ░│
│░░ │  ◉  CAST           1,240.0 CAST  │ ░│
│░░ │     Adpal Cast · Base            │ ░│
│░░ │                                  │ ░│
│░░ │  ◉  ETH              0.128 ETH   │ ░│
│░░ │     Ethereum · Base              │ ░│
│░░ │                                  │ ░│
│░░ │  ◉  DEGEN         8,412.0 DEGEN  │ ░│
│░░ │     Degen · Base                 │ ░│
│░░ │                                  │ ░│
│░░ │  …                               │ ░│
│░░ └──────────────────────────────────┘ ░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
╰──────────────────────────────────────────╯
```

Tap token → commits back to composer, modal closes. No amount input inline — that lives back in the composer.

**Send-gift semantics:** on submit, tokens transfer immediately and irrevocably; recipient is notified. The image + note are delivered separately and can be dismissed by the recipient without affecting the token transfer. Sender sees delivery states (`sent → delivered → opened`) fed by the underlying messaging read-receipt layer.

---

### ⑥ Calendar renderer — under Assets

Sub-view under Assets. Preview canvas is rendered in the actual e-ink display aspect (528×768 portrait), not a wide-week grid. Agenda-style layout fits a tall canvas — a day column would waste vertical space and shrink each cell.

Month view uses the same portrait canvas with a 5×7 grid stacked at the top and event dots below.

The renderer is one instance of a `PersonalRenderer` interface — future renderers (weather, todos, health rings, custom LLM prompt) should share the same shape: source → local layout → optional LLM stylization pass → dither → 528×768 PNG.

```
╭──────────────────────────────────────────╮
│  ←  Calendar → E-ink                     │
├──────────────────────────────────────────┤
│                                          │
│   [ Week ]  ○ Month                      │
│                                          │
│   ‹  Jul 13 – Jul 19             ›       │
│                                          │
│         ┌────────────────────┐           │
│         │  Jul 13 – 19  wk29 │           │
│         │  ────────────────  │           │
│         │                    │           │
│         │  Mon 13            │           │
│         │   ● 09  Standup    │           │
│         │   ● 14  Design rev │           │
│         │                    │           │
│         │  Tue 14            │           │
│         │   ● 10  1:1 Sam    │           │
│         │                    │           │
│         │  Wed 15            │           │
│         │   ● 09  Standup    │           │
│         │   ● 11  Interview  │           │
│         │   ● 15  Ship rev   │           │
│         │                    │           │
│         │  Thu 16            │           │
│         │   ● 10  Product    │           │
│         │   ● 14  Focus      │           │
│         │                    │           │
│         │  Fri 17            │           │
│         │   ● 09  Standup    │           │
│         │   ● 16  Wind-down  │           │
│         │                    │           │
│         │  Sat 18   —        │           │
│         │  Sun 19   —        │           │
│         │                    │           │
│         │      adpal · 07-16 │           │
│         └────────────────────┘           │
│                                          │
│   Style                                  │
│   ○ Minimal  ● Art-deco  ○ Hand-drawn    │
│                                          │
│   Source                                 │
│   📆 iOS Calendar · Work + 2 more        │
│                            [ Change ]    │
│                                          │
│   Auto-refresh                           │
│   ○ Off   ● Weekly (Mon 6am)   ○ Daily   │
│                                          │
│   [ Regenerate ]     [ Save & Cast → ]   │
│                                          │
╰──────────────────────────────────────────╯
```

Data source: iOS EventKit (via native bridge). All heavy lifting is local. Style presets may call a remote LLM/image-gen tool for stylization — that call is opt-in per generation, not a background sync. Fully-local rendering is a privacy selling point (Adpal never sees calendar contents by default).

Regenerate = reruns the layout + stylization pipeline. Save & Cast = writes the PNG to Assets, emits a `calendar` queue item, and casts immediately.

---

### ⑦ Add friend

Two modes via segmented control at top. Default is Scan (camera viewport with corner reticles). Paste mode swaps the viewport for a text input plus a resolved-handle preview card.

```
╭──────────────────────────────────────────╮
│  ←  Add friend                           │
├──────────────────────────────────────────┤
│                                          │
│    [ Scan QR ]   ○ Paste handle          │
│                                          │
│    ┌──────────────────────────────┐      │
│    │ ▛                          ▜ │      │
│    │                              │      │
│    │                              │      │
│    │                              │      │
│    │       (camera viewport)      │      │
│    │                              │      │
│    │                              │      │
│    │                              │      │
│    │ ▙                          ▟ │      │
│    └──────────────────────────────┘      │
│                                          │
│    Point at a friend's Circle QR         │
│                                          │
│  ────────────────────────────────────    │
│                                          │
│    Or share yours                        │
│                                          │
│    ┌────────────────────────────────┐    │
│    │  fern-quill#4821               │    │
│    │                        [ QR ]  │    │
│    │  [ Copy ]  [ Share link ]      │    │
│    └────────────────────────────────┘    │
│                                          │
╰──────────────────────────────────────────╯
```

Paste mode content (replaces the camera viewport):

- Text input with placeholder `word-word#nnnn`
- Hint text: `Handles look like word-word#nnnn. Ask your friend for theirs — they can copy it from Circle → Share QR.`
- Below: preview card resolved from the pasted handle — shows avatar, handle, `Wallet ✓ verified` (confirms handle isn't spoofed), `[ Add remark ]` field, and `[ Add to Circle → ]` primary button

Successful add → returns to Circle tab main; new friend appears in the grid.

---

### ⑧ Settings — additions

Six new sections. Existing Settings content sits above/below unchanged.

```
╭──────────────────────────────────────────╮
│  ←  Settings                             │
├──────────────────────────────────────────┤
│                                          │
│  Circle                                  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Your handle                       │  │
│  │  fern-quill#4821          [ QR ] › │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Wallet                            │  │
│  │  0x7a…c93b · Base              ›   │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  SiXPay                            │  │
│  │  Connected                     ›   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Subscriptions                           │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Active  (2)                   ›   │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Next charge                       │  │
│  │  Jul 20 · 5 USDC · fortune-quill   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Personal renderers                      │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Calendar sources                  │  │
│  │  📆 iOS · Work + 2             ›   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Notifications                           │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Gifts               ● On      ›   │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  New sub posts       ● On      ›   │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Calendar refresh    ○ Off     ›   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Privacy                                 │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Block list  (0)               ›   │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Who can send you gifts            │  │
│  │  Friends only                  ›   │  │
│  └────────────────────────────────────┘  │
│                                          │
├──────────────────────────────────────────┤
│  💰    📡    ◉    📁    ⚙                 │
╰──────────────────────────────────────────╯
```

**"Who can send you gifts = Friends only" is the default.** Any-can-send would open the door to strangers spamming case space with paid-attention tricks — breaks the whole gift/circle framing.

## Interaction details

- **Dismiss-gift toast.** After swiping up on a gift card in the queue browser, surface a toast: `Image dismissed. 10 USDC stays in your wallet.` Reinforces the tip-then-cast decoupling at the moment of the action.

- **Delivery indicators for sender.** In an outgoing tip's history entry, show a state chip: `Sent` → `Delivered` → `Opened` (three-dot progression, driven by the messaging layer's read receipts). No push to sender when opened — this is passive metadata.

- **Ribbon tap.** As noted in ③: opens the Circle queue browser preloaded on that item. Same behavior whether the tile is on the Featured tab or the Subs tab.

- **Paid sub post blur.** Unpulled paid posts render blurred in gallery grids and in the queue browser card. Explicit `[ Pull ]` button reveals the content. Free posts render clear immediately.

- **Currently-cast mint frame.** Existing 2px `#00FFC2` inset frame behavior extends to Circle-sourced tiles when they are the current cast — no special handling needed.

## Reference material

- Bottom-nav accent tokens: `client/src/App.tsx` `tabAccents` map (lines 357-412)
- Existing Cast layout: `client/src/components/ImageCasting.tsx`
- Existing top-bar pattern to mirror: `client/src/components/CampaignGallery/CampaignGallery.tsx` (lines 170-277)
- Token picker source pattern: `/Users/jax/Projects/sixpay/zct-cl-proj/apps/sixpay/src/app/components/merchant/AssetSelectorModal.tsx` (modal shape) and `DepositApp.tsx` around line 1000 (balance-bearing rows)
- Brand guidelines: `platform/ADPAL_BRAND_GUIDELINES.md`
