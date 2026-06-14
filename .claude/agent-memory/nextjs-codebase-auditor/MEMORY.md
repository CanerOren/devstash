# Memory Index

- [Project Conventions](project-conventions.md) — Confirmed DevStash conventions: Tailwind v4 CSS-only config, data-driven inline styles are valid, no auth yet is intentional
- [False-Positive Traps](false-positive-traps.md) — Known non-issues: .env is gitignored, demo user is intentional, generated Prisma `any` is auto-code, data-driven inline styles are allowed
- [Audit Findings — First Run](audit-findings-first-run.md) — Recurring true positives: unbounded queries in getPinnedItems/getSidebarCollections, duplicated toLabel + DEMO_USER_EMAIL, test-db.ts deep include
