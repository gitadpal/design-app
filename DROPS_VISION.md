# Drops — Vision & Strategy

> **One line.** Turn an AI-generated character *you own* into an ambient collectible on your e-ink case — and, if you fall for it, into a real toy.

**Scope of this doc:** strategy & vision only. It fixes the *what* and the *why* and the phased *how-big*, not the build. No data models, components, or code — those come in a separate build spec once the vision is agreed.

**"Drops"** is the umbrella name for the whole feature — the collectibles *and* the act of creating them ("make a Drop"). It lives **inside Circle, as a parallel section to Subs** (see §2).

---

## 1. Thesis

adpal already turns a phone case into an always-on display surface. Drops turns that surface into a **collectible object economy**: users generate their own characters with AI, *reveal* them by casting to the case, own them as NFTs, show them off ambiently, gift and trade them inside their Circle, and — optionally — have them fabricated into real designer toys through a neutral network of factories.

It is PopMart's blind-box thrill without PopMart's core cost. PopMart must *own* desirable IP (Labubu, Molly); Drops lets every user generate their own, and people are attached to what they made in a way they never are to what they bought. The scarce, licensable design becomes an infinite, personal, zero-licensing one.

## 2. Where it lives: Circle's two sections

Drops lives **inside Circle, as a parallel section to Subs**. Circle becomes a two-economy home on one set of rails — the same case, wallet, friends, and gifting layer serve both:

| | **Subs** (existing / near-term) | **Drops** (this feature) |
|---|---|---|
| Content | Daily posters — weather, the-plate, daily-masterpiece | User-created collectible characters |
| Cadence | Recurring, glanceable | One-time creation, then owned forever |
| UX | Preview-first (see before you cast) | **Sealed** — reveal *by* casting |
| Value | Ambient information / culture | Identity, collection, flex, trade |

Placing Drops beside Subs (rather than as a fifth top-level tab or a Cast sub-flow) keeps navigation simple and lets it inherit Circle's social graph and gifting for free — gift and trade are native to where it lives. This doc is only about the **Drops** section.

## 3. The core loop

**Create → reveal → own → gift/trade → (optionally) make real.**

1. **Create.** Two modes (see §4). The output is a unique character with variable rarity/finish.
2. **Reveal by casting.** The item arrives *sealed* — you can't see it in-app. Casting to your case is the unboxing; e-ink's slow "develop" *is* the reveal ritual (and conveniently masks generation latency).
3. **Own.** It's yours as an NFT — provenance and token ownership, displayed on your case, swappable daily.
4. **Gift / trade.** Send it to a Circle friend (a personalized creation is a far stronger gift than a sealed box); trade duplicates and chases (later phase).
5. **Make real.** If you love it, route it to a factory to fabricate as a physical toy, in a material/finish of your choice — authenticated back to the NFT.

## 4. The creation model

Two modes, one bounded-tries safety net.

- **Seeded surprise** (casual, default). Pick a *style/series* ("cozy woodland," "porcelain spirits," "cyber-mech") and optionally a seed (a word, a pet photo). The AI rolls a *unique* character; some finishes are rarer than others (holo, gold, a 1-of-N "secret"). You direct the vibe; the AI surprises you with the specifics; rare finishes drive the chase. This is where the gacha psychology lives.
- **Artist mode** (power / free will). Prompt openly and iterate — an AI commission for people who want full control. Trades the lottery thrill for authorship.

**Bounded tries — the buyer's-remorse fix.** A creation is not a single blind roll you're stuck with; you get a *small, bounded* number of tries and keep your favorite. Tries are tiered to the revenue model: **3 on pay-per-creation, 5 on premium subscription.** Enough to reliably land something you love, few enough that the outcome still feels earned (and that rare finishes stay meaningful). This is the single most important dial in the product — it's what separates "delightful" from "I paid and hate it."

## 5. Why it's defensible

Against PopMart *and* against generic AI-art tools:

- **User-owned IP → no licensing, infinite supply, no inventory.** Every design is generated on demand and fabricated only if ordered. You never guess which figure to manufacture.
- **Endowment attachment.** People chase-and-keep their *own* creation harder than a bought one. That's retention you can't license.
- **The case is the showcase.** A PopMart figure sits in a box on a shelf. Yours rides on the back of your phone — ambient, social, swappable. The flex loop is structurally stronger, and it's the whole point of a collectible.
- **NFC authenticity is uniquely yours.** adpal is already an NFC company. A fabricated toy can ship with an NFC tag that verifies authenticity and re-links to its NFT — a phygital provenance loop PopMart structurally cannot close.
- **The reveal is the ritual, not a loading screen.** e-ink's slow refresh, normally a weakness, becomes the "developing" unboxing — and hides the generation wait.

## 6. Economics

Primary revenue (in scope for this phase):

- **Pay-per-creation.** Buy a creation through the existing SiXPay checkout → get 3 tries → keep one. Ties revenue directly to the core action.
- **Premium subscription.** Monthly plan → more creations, **5 tries**, premium styles/series, featured display slots. The tries-tiering makes the subscription's value obvious.

Deliberately *not* primary revenue this phase (add later, once the marketplace has liquidity):

- **Fabrication take-rate.** Physical fabrication is offered as a value-add and retention driver — routed at/near cost — rather than a margin center for now. A small take-rate is a natural later lever.
- **Trade / gift royalties.** Deferred with the trading layer (Phase 3).

Ownership is a **user-owned NFT** (provenance + tradability). See the IP stance in §10.

## 7. Fabrication as a curated protocol

adpal is neither a factory nor a pure classifieds board. It is a **curated protocol** that owns the rails and stays neutral on the ends:

- **Neutral on** *what* users create (permissionless, privacy-preserving — adpal does not proactively inspect designs) and *who* prints (open supply of factories competing on price, material, quality).
- **Owned by adpal** (the moat): the creation + reveal + display/social experience, the **design → printable-spec bridge**, payments/escrow, factory reputation, and NFC provenance. The printing is a commodity; the connective tissue is not.
- **Digital-first, ship-on-demand.** Most value is the digital collectible; physical is an *optional* redemption, fabricated only when ordered — no inventory risk.
- **Verified, rated factories with escrow.** "Neutral" still curates on *trust*, because a user's beloved creation printed badly bruises adpal's brand no matter who pressed print.

## 8. What adpal stays neutral about — and where it can't

Neutrality is a feature on the **digital/creation** layer: users own their designs, adpal doesn't judge art, generation is permissionless. Keep that.

It is **not** a liability shield on the **physical** layer. Selling a shipped physical good through your rail inherits real-world obligations — IP takedowns, product safety, and reputational spillover ("adpal printed a counterfeit / a toxic figurine") — regardless of who fabricated it. The honest posture is **low-touch, not zero-touch**: no proactive content inspection, but a reactive takedown/reporting system, factory KYC, and factory ToS that pushes IP/safety compliance downstream.

## 9. Phasing

- **Phase 1 — Digital, feel-it-now.** Create (seeded surprise + artist mode, tries) → cast-to-reveal → own → gift, as a new section in Circle. Fully digital; generation can be *mocked* with a curated character pool so the entire emotional loop is real before any model or backend is wired. **Proves:** does the reveal feel magical, and does bounded-tries seeded-surprise actually satisfy? Everything else is downstream of that answer.
- **Phase 2 — Fabrication marketplace.** Plug the curated-protocol fabrication network behind the "make real" fork. **Launch with printed trading cards / prints** — flat, cheap, and reliable, closest to the e-ink poster — then ladder up through acrylic standees and pins toward 3D resin figures. Add the NFC authenticity tag. **Proves:** the phygital redemption and the neutral-rails trust model.
- **Phase 3 — Trading & secondary market.** Listings, floors, resale, trade/gift royalties. **Proves:** the collectible *economy*, not just the object.

Each phase is independently valuable and independently killable. Phase 1 validates the entire premise on primitives already shipped.

## 10. Honest risks

- **Buyer's remorse vs. gacha thrill** — the central tension; bounded tries (§4) is the mitigation, and getting the number right is the whole game.
- **Fabrication reality.** "Any material/surface" is a north star, not v1. Cards/prints are the reliable start; AI 2D art → a quality 3D toy is a genuine frontier (3D-model generation, printability, finishing). Ladder up.
- **AI-IP is legally unsettled.** Pure-AI works have contested copyright. The stance (§11) is **provenance, not an IP claim**: pitch "yours to display, trade, and fabricate," not "you own defensible IP" — pending counsel.
- **Moderation is mandatory.** Open generation + physical production invites trademark abuse and worse. A pre-fabrication moderation gate is an operating cost, not an optional.
- **Gambling/regulatory.** Paid randomized outcomes brush loot-box law. Published odds (Web3 helps — provably fair), bounded tries, age gating, and the artist-mode alternative are the defensible posture.
- **Two-sided cold start.** The marketplace must win factories *and* users at once — materially harder than a single-partner service launch.
- **The design → printable-spec gap** is the real technical moat. If adpal outsources it to be "purely neutral," it becomes a dumb pipe with no defensibility. Own this.

## 11. Decisions

**Locked (from review):**

- **Name** — **Drops**, umbrella for the whole feature ("make a Drop"). No separate engine brand.
- **Placement** — inside **Circle, as a parallel section to Subs**.
- **Creation** — seeded surprise **+** artist mode, with **bounded tries: 3 on pay-per-creation, 5 on subscription** (keep your favorite).
- **Revenue** — **pay-per-creation + premium subscription** are primary; **fabrication take-rate and trade royalties deferred**, added later once the marketplace has liquidity.
- **Fabrication** — **curated protocol / neutral rails** (neutral on content & who prints; adpal owns creation, reveal, escrow, the design→printable-spec bridge, and NFC provenance).
- **IP stance** — **provenance, not an IP claim.** "Yours to display, trade, and fabricate," pending legal sign-off.
- **First fabrication format (Phase 2)** — **printed trading cards / prints.**

**Still to resolve (later / needs work — not blockers for the Phase-1 vision):**

- Exact pricing — per-creation price and subscription tier price.
- Legal review of the provenance wording and the odds-disclosure / loot-box posture before any paid launch.
- Factory onboarding bar (KYC, quality gate) and the design→printable-spec pipeline — the technical moat.
- Moderation-gate design for the pre-fabrication check.

---

*Decisions captured from review: name = Drops (umbrella); placement = a section in Circle parallel to Subs; creation = seeded surprise + artist mode with bounded tries (3 pay-per / 5 subscription); revenue = pay-per-creation + premium subscription, fab/trade take-rate deferred; fabrication = curated protocol; IP = provenance not ownership claim; first fabrication format = trading cards / prints; this document = strategy & vision only.*
