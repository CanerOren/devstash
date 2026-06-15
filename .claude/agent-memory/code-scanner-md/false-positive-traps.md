---
name: false-positive-traps
description: Patterns in DevStash that look like issues but are NOT — confirmed by reading source
metadata:
  type: feedback
---

1. `.env` not gitignored — FALSE. `.env*` glob on line 34 of `.gitignore`.
2. DB fetchers scope to the session user via `requireUserId()` (`src/lib/db/helpers.ts`), which reads the NextAuth session and throws if absent. `/dashboard` is gated by `src/proxy.ts`. Do NOT flag these fetchers as "missing auth," and do NOT flag the `throw` as an unhandled error (routes are gated; auth is wired as of auth phase 3). `DEMO_USER_EMAIL` no longer exists.
3. `any` in `src/generated/prisma/` — Prisma 7 auto-generated, gitignored, ESLint-ignored.
4. `style={{ color: type.color }}` inline styles — data-driven colors from DB, explicitly allowed and annotated in each file.
5. Missing `tailwind.config` — correct for Tailwind v4.
6. Missing Pro gating on upload routes — no upload routes exist yet.

**Why:** These caused false positives in past analysis.
**How to apply:** Check this list before filing any finding in these categories.
