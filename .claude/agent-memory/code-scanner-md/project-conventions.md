---
name: project-conventions
description: DevStash project conventions confirmed from CLAUDE.md and coding-standards.md
metadata:
  type: project
---

- Tailwind v4: no `tailwind.config.ts/js`, config in `@theme` in `globals.css`. Confirmed correct.
- Inline styles for data-driven colors (hex from DB) are the ONLY allowed exception to "no inline styles." All uses are annotated with comments.
- `.env*` is in `.gitignore` — never report env exposure.
- Auth IS wired (NextAuth v5, auth phase 3). DB fetchers scope queries to the session user via `requireUserId()` in `src/lib/db/helpers.ts` (`auth()` → `session.user.id`, throws if missing); `/dashboard` is gated by `src/proxy.ts`. The old `DEMO_USER_EMAIL` constant was removed. The seeded `demo@devstash.io` user is now just a normal login.
- `src/generated/prisma/` is auto-generated and gitignored; any `any` there is not hand-written code.
- Pro gating on upload routes — no upload routes implemented yet; cannot flag absence.
- Server Actions must return `{ success, data, error }` — no actions implemented yet; nothing to flag.

**Why:** Prevents wasted audit cycles on intentional patterns.
**How to apply:** Verify file context before filing inline style or any-type findings.
