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