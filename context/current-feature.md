# Current Feature

<!-- Feature name and short description -->

## Status

<!-- Not Started | In Progress | Completed -->

## Goals

<!-- Goals and requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

- **2026-06-06** — Initial Next.js 16 + React 19 + Tailwind v4 + TypeScript scaffold (Create Next App). Removed default boilerplate SVGs, edited starter `page.tsx` / `globals.css`, and added project context docs. Committed as `chore: initial next.js and tailwind setup` and pushed to `origin/main` (https://github.com/CanerOren/devstash.git).
- **2026-06-08** — Dashboard UI Phase 1 (branch `feature/dashboard-phase-1`). Initialized shadcn/ui (Next template, radix base) — added `components.json`, `src/lib/utils.ts`, theme tokens in `globals.css`, and `ui/button.tsx` + `ui/input.tsx`. Enabled dark mode by default (`dark` class on `<html>`) and updated app metadata. Built the `/dashboard` shell: `dashboard/layout.tsx` (TopBar + Sidebar + main), `dashboard/page.tsx` (`Main` placeholder), `TopBar.tsx` (display-only search + New Collection / New Item buttons), and `Sidebar.tsx` (`Sidebar` placeholder). `npm run build` and `npm run lint` pass.
- **2026-06-08** — Dashboard UI Phase 2 — functional sidebar (branch `feature/dashboard-phase-2`). Replaced the Phase 1 `Sidebar` placeholder with a data-driven sidebar fed from `src/lib/mock-data.ts`. Added `sidebar-context.tsx` (client context tracking desktop `collapsed` rail state + mobile drawer state), `SidebarContent.tsx` (item types linking to `/items/[type]`, favorite + recent collection sections, bottom user/avatar area), and `type-icons.ts` (maps `ItemType.icon` names → Lucide components). The sidebar collapses to a narrow icon-only rail (icons stay visible/clickable with tooltips) via a toggle in its own header next to a "Navigation" label; renders as an overlay drawer on mobile (menu button in `TopBar`, `md:hidden`). Added a white "DS" logo box left of "DevStash" in `TopBar`. Wired up the Geist font site-wide by fixing the broken self-referential `--font-sans` in `globals.css` (was silently falling back to the system font). `npm run build` and `npm run lint` pass.
- **2026-06-08** — Dashboard UI Phase 3 — main content area (branch `feature/dashboard-phase-3`). Filled the `Main` placeholder in `dashboard/page.tsx` with the dashboard home: a header, 4 stats cards (total items, collections, favorite items, favorite collections — not in the screenshot), a Collections grid, a Pinned items list, and a Recent items list (sorted by `createdAt`, limit 10). All fed from `src/lib/mock-data.ts`. Added presentational server components `StatCard.tsx`, `CollectionCard.tsx` (top border tinted by primary item-type color, footer type icons), and `ItemCard.tsx` (left border in item-type color, tags, date). The page resolves item-type ids via a `Map` and passes resolved types down as props, keeping everything server-rendered (`createElement(getTypeIcon(...))` in `ItemCard` to satisfy the `react-hooks/static-components` lint rule). `npm run build`, `npm run lint`, and `npx tsc --noEmit` pass.
