# Homepage

## Overview

Port the static marketing homepage prototype in `prototypes/homepage/`
(`index.html` / `styles.css` / `script.js`) into the real Next.js app as the
public landing page at `/`. Match the prototype's visual design and behavior,
but rebuilt as React with Tailwind/shadcn, split into server and client
components.

The prototype is the source of truth for layout, copy, palette, and
animations — open it (or the `/feature`-history entry from 2026-07-16) for the
exact design. This spec covers how to structure it in the app.

## Routing

- Replace the placeholder `src/app/page.tsx` (currently `<h1>Devstash</h1>`)
  with the homepage. Public route — **not** behind the `proxy.ts` auth gate.
- Root `layout.tsx` already provides `<html class="dark">`, fonts, and
  `<Toaster />`; the homepage needs no sidebar/app chrome.
- **Optional (recommended):** the page is a server component, so call `auth()`.
  If the user is signed in, the nav + hero CTAs point to `/dashboard` ("Go to
  Dashboard") instead of Sign In / Get Started.

## Component Breakdown

Put everything under `src/components/marketing/`. Keep sections server-rendered;
only the interactive pieces are client components.

**Server components** (static markup):
- `Hero.tsx` — hero text (headline, sub, CTAs) + composes `ChaosShowcase`
- `DashboardPreview.tsx` — the "…with DevStash" mini-dashboard mockup
- `Features.tsx` — 6 feature cards
- `AiSection.tsx` — Pro checklist + code-editor/AI-tags mockup
- `Pricing.tsx` — the two price cards (composes the client toggle)
- `Cta.tsx`, `SiteFooter.tsx` (footer year via `new Date().getFullYear()` on the server)

**Client components** (`'use client'`, interactivity only):
- `SiteNav.tsx` — fixed nav; adds opacity/blur once scrolled (scroll listener)
- `ChaosShowcase.tsx` (or `ChaosField.tsx`) — the animated chaos icons
- `BillingToggle.tsx` — monthly/yearly state; swaps the Pro price text
- `Reveal.tsx` — reusable scroll-in fade wrapper (IntersectionObserver → adds
  `in-view`); wrap each section-heading/card group with it

## Sections & Behavior

1. **Nav** — logo, Features/Pricing links, Sign In + Get Started. Fixed;
   grows opaque + blurred on scroll. Nav links hide on mobile.
2. **Hero** — gradient headline "Stop Losing Your Developer Knowledge",
   subheadline, two CTAs; below it the chaos → arrow → dashboard showcase.
   - **Chaos field:** 8 labeled source icons that drift, bounce off the walls,
     pulse/rotate, and repel from the cursor via `requestAnimationFrame`. Each
     icon = a wrapper that *translates* + an inner tile that *rotates/scales* +
     an *upright label* (so labels don't spin). Only animate while on-screen
     (IntersectionObserver); honor `prefers-reduced-motion` (skip animation).
   - **Arrow:** CSS pulse; rotates 90° (points down) on mobile.
   - **Dashboard preview:** labeled sidebar rail, search top bar + avatar,
     "Recent" heading, and item cards (type icon + title + tag pills + accent
     top border).
3. **Features** — 6 cards (Code Snippets, AI Prompts, Instant Search, Commands,
   Files & Docs, Collections), each tinted by its item-type accent; on a
   lighter full-bleed band for separation.
4. **AI section** — Pro badge + capability checklist; code-editor mockup with a
   staggered "AI Generated Tags" reveal.
5. **Pricing** — Free ($0) vs Pro; monthly/yearly toggle ($8/mo ↔ $6/mo, "$72
   billed once a year"); Pro card highlighted with "Most Popular".
6. **CTA** — "Ready to Organize Your Knowledge?" + button.
7. **Footer** — logo, link columns, copyright with the current year.

## Links / Navigation Targets

- Logo → `/` · Features → `#features` · Pricing → `#pricing`
- Sign In → `/sign-in` · Get Started / Get Started Free / Go Pro → `/register`
- See Features → `#features`
- Footer Product links → `#features` / `#pricing`; other footer links →
  placeholder `#` for now
- Use `next/link` for route links; plain `<a href="#…">` for in-page anchors.
- (If the signed-in variant is done: those CTAs → `/dashboard`.)

## Styling

- Tailwind v4 utilities + shadcn `Button` (and `Badge` where it fits) — no
  standalone CSS files per component.
- Add the item-type accent palette as theme tokens in `globals.css`
  (`@theme`): snippet `#3b82f6`, prompt `#f59e0b`, command `#06b6d4`, note
  `#22c55e`, file `#64748b`, image `#ec4899`, link/url `#6366f1`. Text and
  primary buttons use the **snippet blue** (not purple).
- Put keyframes (`arrow-pulse`, tag reveal) and any hard-to-express selectors
  (chaos grid background, gradient text) in `globals.css`; everything else in
  utilities.

## Technical / DRY

- Drive repeated UI from data arrays mapped in the component: feature cards,
  pricing tiers/features, footer columns, chaos icons, nav links. Co-locate
  these as `const` data (e.g. `marketing/data.ts`).
- Icons: use `lucide-react` for generic glyphs. Brand marks lucide doesn't ship
  (GitHub, Slack, Notion, VS Code) become tiny local SVG components (follow the
  existing `GitHubIcon` pattern from the auth forms).
- Keep the animation logic in one hook/effect inside `ChaosShowcase`; clean up
  listeners/RAF on unmount.

## Out of Scope

- No new routes, DB, or server actions — this is a presentational page.
- The `prototypes/homepage/` files stay as the reference; don't delete them.

## Reference

`prototypes/homepage/index.html` · `styles.css` · `script.js` — the prototype
to port 1:1 in look and behavior.
