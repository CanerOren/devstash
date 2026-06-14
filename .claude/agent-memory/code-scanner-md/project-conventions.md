---
name: project-conventions
description: DevStash project conventions confirmed from CLAUDE.md and coding-standards.md
metadata:
  type: project
---

- Tailwind v4: no `tailwind.config.ts/js`, config in `@theme` in `globals.css`. Confirmed correct.
- Inline styles for data-driven colors (hex from DB) are the ONLY allowed exception to "no inline styles." All uses are annotated with comments.
- `.env*` is in `.gitignore` — never report env exposure.
- No auth yet: `DEMO_USER_EMAIL` hardcoded in db fetchers is intentional. Not a security issue.
- `src/generated/prisma/` is auto-generated and gitignored; any `any` there is not hand-written code.
- Pro gating on upload routes — no upload routes implemented yet; cannot flag absence.
- Server Actions must return `{ success, data, error }` — no actions implemented yet; nothing to flag.

**Why:** Prevents wasted audit cycles on intentional patterns.
**How to apply:** Verify file context before filing inline style or any-type findings.
