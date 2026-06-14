---
name: audit-findings-first-run
description: Recurring true-positive patterns found in the first full codebase audit (June 2026)
metadata:
  type: project
---

**Confirmed real issues to watch in future audits:**

1. **`getPinnedItems()` has no `take` limit** — `src/lib/db/items.ts` line 104. Returns ALL pinned items with no cap. Low risk now (few items), but will grow unboundedly. Watch for when item counts scale.

2. **`getSidebarCollections()` has no `take` limit** — `src/lib/db/collections.ts` line 112. Returns ALL user collections. Pro users with unlimited collections will get full list on every page load.

3. **`as string` type assertion in `getSidebarCollections`** — `src/lib/db/collections.ts` line 150. `colorById.get(primaryId) as string` — the `as string` cast bypasses null safety. `primaryId` is guaranteed non-null by the `if (primaryId)` guard on line 149, but the `Map.get()` could still return `undefined` if a race occurred. Minor but violates strict typing.

4. **Seed script stores demo password in plaintext in source** — `prisma/seed.ts` line 37. `password: "12345678"` is in the DEMO_USER constant. This is a dev seed, not production data, so it's low severity. But the password is trivially guessable and in version control.

5. **`scripts/test-db.ts` uses a deeply nested include without select projections** — lines 61-79. Fetches the full demo user with all collections, all items in each collection, all item types and tags per item. This is a test script, not production code, but the pattern (deep nested include with no `select` limits) should not be copied to production fetchers.

6. **`toLabel` function is duplicated** — identical implementation in both `src/lib/db/items.ts` (line 45) and `src/lib/db/collections.ts` (line 43). Should live in a shared `src/lib/utils.ts` or `src/lib/db/helpers.ts`.

7. **`DEMO_USER_EMAIL` constant is duplicated** — defined in `src/lib/db/items.ts` (line 5), `src/lib/db/collections.ts` (line 5), and `src/lib/db/user.ts` (line 5). Should be a single exported constant.

**Why:** These are the confirmed non-false-positive issues from the June 2026 full audit.
**How to apply:** In future audits, check these specific locations first as recurring hotspots.
