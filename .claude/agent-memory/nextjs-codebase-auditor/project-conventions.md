---
name: project-conventions
description: Confirmed DevStash project conventions that map directly to audit severity decisions
metadata:
  type: project
---

Key conventions confirmed from CLAUDE.md + coding-standards.md:

- **Tailwind v4** — no `tailwind.config.ts/js` allowed. Config lives exclusively in `@theme` inside `src/app/globals.css`. Confirmed: no config file exists.
- **Inline styles allowed for data-driven colors only** — item type colors and collection primary colors are dynamic hex values from the DB (`ItemType.color`). The codebase annotates these with comments like "color is data-driven, so accent must be inline." Do NOT flag these as violations of the "no inline styles" rule.
- **No auth yet — demo user hardcoded** — all DB fetchers are scoped to `DEMO_USER_EMAIL = "demo@devstash.io"`. This is intentional per project overview. Do NOT flag missing auth checks as a security issue.
- **`.env` IS in `.gitignore`** — confirmed `.env*` glob on line 34 of `.gitignore`. Never report env file exposure.
- **`src/generated/prisma` is gitignored** — Prisma 7 emits client outside `node_modules`. Any `any` inside `src/generated/` is auto-generated code, not hand-written — do NOT flag.
- **Server actions** must return `{ success, data, error }` — no server actions exist yet (dashboard is read-only), so nothing to flag here.
- **Pro gating** — file/image upload routes must server-side gate on `isPro`. No upload routes exist yet — do NOT flag as missing.
- **`export const dynamic = "force-dynamic"`** on dashboard page + layout — correct pattern for per-request rendering before auth cookies are used.

**Why:** Knowing these conventions prevents false positives on data-driven inline styles, generated code `any`, and intentional demo-user scoping.
**How to apply:** Always check whether an inline style has a nearby comment explaining it's data-driven before flagging it. Always check whether the file is in `src/generated/` before flagging `any`.
