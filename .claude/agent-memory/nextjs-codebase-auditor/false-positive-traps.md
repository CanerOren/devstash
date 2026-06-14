---
name: false-positive-traps
description: Known false-positive patterns in DevStash that must NOT be reported as issues
metadata:
  type: feedback
---

**Never report these as issues:**

1. **`.env` exposure** — `.env*` is on line 34 of `.gitignore` as a glob. Always confirmed. Never flag.

2. **Missing auth on DB fetchers** — `DEMO_USER_EMAIL` constant in `src/lib/db/*.ts` is intentional. Auth is not yet implemented. Do not flag hardcoded demo email as a security issue.

3. **`any` in `src/generated/prisma/`** — Prisma 7 auto-generates these types. They are gitignored and not hand-written. ESLint also ignores this directory (`src/generated/**` in `eslint.config.mjs`).

4. **Inline `style={}` for color props** — All inline styles in `CollectionCard`, `ItemCard`, `SidebarContent`, `StatCard` are for data-driven hex colors from the DB. Comments in each file explicitly note this. This is the only valid use case for inline styles per coding-standards.md.

5. **`tailwind.config` absence** — This is CORRECT for Tailwind v4. No config file should exist. Absence is not an issue.

6. **Pro-only upload routes missing gating** — No upload routes (`/api/upload`) are implemented yet. Cannot gate what doesn't exist.

**Why:** These patterns appeared in past audit cycles and led to wasted review time on non-issues.
**How to apply:** Before filing any finding in these categories, confirm the file/line exists and is NOT covered by the above exceptions.
