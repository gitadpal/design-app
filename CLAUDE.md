# CLAUDE.md

## Commands

- `npm run dev` — Start dev server on port 3000 (auto-opens browser)
- `npm run build` — Production build to `build/` directory

No test runner or linter is configured.

## Architecture

This is a mobile-first React SPA (max-width `md` / 448px) built with Vite, TypeScript, and Tailwind CSS v4. It was generated from a Figma design (Gemini code export).

### Stack

- **React 18** with Vite 6 and `@vitejs/plugin-react`
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin — configuration is CSS-based in `src/styles/globals.css` (no `tailwind.config.js`)
- **shadcn/ui** component library in `src/components/ui/` — uses Radix UI primitives, `class-variance-authority`, and the `cn()` utility from `src/components/ui/utils.ts`
- **Motion** (formerly Framer Motion) for animations — imported as `motion/react`
- **Lucide React** for icons
- **Recharts** for charts
- **Sonner** for toast notifications

### Path Alias

`@` maps to `src/` (configured in `vite.config.ts`). The vite config also contains versioned package aliases (e.g., `sonner@2.0.3` → `sonner`) from the Figma export — imports in generated code use these versioned specifiers.

### App Structure

`App.tsx` is a tab-based SPA with four top-level views managed by `useState`:

| Tab | Component | Purpose |
|-----|-----------|---------|
| Earnings | `AdCampaigns` | Ad campaign listings, campaign details, bonus rewards, active commitments, participation history |
| Cast | `ImageCasting` | Image casting/display functionality tied to active commitments |
| Assets | `Assets` | Wallet/asset management |
| Settings | `Settings` | App settings with sub-views (currency, language, network, recovery, etc.) |

Navigation state (views, sub-views) is lifted to `App.tsx` and passed as props — there is no router.

### Styling

- CSS custom properties for theming defined in `src/styles/globals.css` (light + dark mode via `.dark` class)
- Custom gradient utilities: `gradient-primary`, `gradient-earn`, `gradient-cast`, `gradient-wallet`, `gradient-settings`, etc.
- Custom utilities: `glass-effect`, `glow-primary`, `glow-success`, `text-gradient-primary`, `text-gradient-success`, `tab-label`, `section-header`
- Tailwind entry point is `src/index.css` which imports globals and `tw-animate-css`

### Figma Asset Handling

Image assets from Figma use hash-based filenames in `src/assets/` and are aliased in `vite.config.ts` via `figma:asset/...` paths.
