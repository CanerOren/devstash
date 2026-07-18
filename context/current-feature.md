# Current Feature

## Status

<!-- Not Started | In Progress | Complete -->

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from spec -->

## History

<!-- Keep this updated. Earliest to latest. One line per feature — full detail lives in git commits. -->

- **2026-06-06** — Initial Next.js 16 + React 19 + Tailwind v4 + TS scaffold; removed boilerplate, added context docs.
- **2026-06-08** — Dashboard UI Phase 1 (`feature/dashboard-phase-1`): shadcn/ui init, dark mode default, `/dashboard` shell (TopBar/Sidebar/main placeholders).
- **2026-06-08** — Dashboard UI Phase 2 (`feature/dashboard-phase-2`): data-driven sidebar (mock-data) — collapsible rail, mobile drawer, type icons, Geist font fix.
- **2026-06-08** — Dashboard UI Phase 3 (`feature/dashboard-phase-3`): main content — stats cards, Collections grid, Pinned + Recent lists; `StatCard`/`CollectionCard`/`ItemCard`.
- **2026-06-09** — Prisma 7 + Neon setup (`feature/prisma-neon-setup`): full initial schema + migration, Neon driver adapter, pooled/direct URLs, prisma singleton, seed + smoke test.
- **2026-06-09** — Seed data (`feature/seed-data`): demo user + 5 collections / 18 items / 22 tags, idempotent.
- **2026-06-09** — Dashboard collections from DB (`feature/dashboard-collections`): `getDashboardCollections`/`getCollectionStats`, `force-dynamic`.
- **2026-06-09** — Dashboard items from DB (`feature/dashboard-items`): `getPinnedItems`/`getRecentItems`/`getItemStats`; all stat cards DB-backed.
- **2026-06-10** — Stats & sidebar from DB (`feature/stats-sidebar`): sidebar fetchers, `getCurrentUser`, viewport-pinned shell.
- **2026-06-11** — Pro badge in sidebar (`feature/add-pro-badge-sidebar`): PRO badge on Files/Images types.
- **2026-06-11** — DB fetcher quick wins (`feature/db-fetcher-quick-wins`): capped 2 unbounded queries, removed unsafe cast, `helpers.ts` dedupe.
- **2026-06-15** — Auth Phase 1 (`feature/auth-phase-1`): NextAuth v5 + GitHub OAuth, split-config, proxy middleware guarding `/dashboard`.
- **2026-06-15** — Auth Phase 2 (`feature/auth-phase-2`): Credentials (email/password) provider + `/api/auth/register` (Zod, bcrypt).
- **2026-06-15** — Auth Phase 3 (`feature/auth-phase-3`): custom `/sign-in` + `/register` UI, session-scoped dashboard via `requireUserId()`.
- **2026-06-16** — Email verification (`feature/email-verification`): Resend, verify/resend routes, credentials sign-in gated on verified email.
- **2026-06-17** — Email-verification toggle (`feature/email-verification-toggle`): `EMAIL_VERIFICATION_ENABLED` env switch.
- **2026-06-17** — Forgot password (`feature/forgot-password`): reset flow reusing VerificationToken table, `reset:` namespace, 1h TTL.
- **2026-06-17** — Profile page (`feature/profile`): `/profile` inside AppShell; change-password + delete-account actions.
- **2026-06-27** — Rate limiting (`feature/rate-limiting`): Upstash sliding-window on auth endpoints, fail-open.
- **2026-06-27** — Fix GitHub OAuth redirect (`fix/github-auth-redirect`): moved GitHub sign-in to a server action; also stood up Vitest.
- **2026-06-29** — Items list view (`feature/item-list-view`): `/items/[type]` route, `getItemsByType`.
- **2026-06-29** — Three-column item list (`feature/three-column-item-list`): grid `lg:grid-cols-3`.
- **2026-06-29** — Item detail drawer (`feature/item-drawer`): slide-in Sheet, `getItemDetail` + `/api/items/[id]`, copy functional.
- **2026-07-01** — Item drawer edit mode (`feature/item-drawer-edit`): inline edit via `updateItem` action, sonner toasts.
- **2026-07-02** — Delete item (`feature/delete-item`): `deleteItem` action + confirm AlertDialog.
- **2026-07-02** — Item create (`feature/item-create`): New Item dialog for 5 TEXT/URL types, `createItem`.
- **2026-07-02** — Code editor Monaco (`feature/code-editor`): `CodeEditor` for snippet/command, type-specific create button.
- **2026-07-03** — Markdown editor (`feature/markdown-editor`): Write/Preview tabs for note/prompt.
- **2026-07-03** — File & image upload R2 (`feature/file-image-upload`): activated Pro file/image types, `/api/upload` + download proxy.
- **2026-07-04** — Image gallery view (`feature/image-gallery-view`): thumbnail gallery on `/items/images`, auth-gated image proxy route.
- **2026-07-04** — File list view (`feature/file-list-view`): Drive-style rows on `/items/files`, `formatFileSize`.
- **2026-07-04** — Item title above filename in file rows (`d938236`).
- **2026-07-04** — Hover copy button on dashboard item cards (`b9511f3`).
- **2026-07-04** — Dedupe `formatFileSize` into shared util (`refactor/dedupe-format-file-size`).
- **2026-07-12** — Audit quick-win fixes (`feature/audit-quick-wins`): SVG nosniff, leaner file fetcher, `deleteAccount` R2 cleanup.
- **2026-07-13** — Refactor: split `ItemDrawer` + dedup `items.ts` mappers (`refactor/split-item-drawer`).
- **2026-07-14** — Collection create (`feature/collection-create`): New Collection dialog, `createCollection`.
- **2026-07-14** — Add item to collections (`feature/add-item-to-collections`): multi-select membership via ItemCollection.
- **2026-07-14** — Collections pages (`feature/collections-pages`): `/collections` + `/collections/[id]`.
- **2026-07-14** — Collection edit/delete/favorite actions (`feature/collection-actions`): card menu + detail-header controls (favorite display-only this pass).
- **2026-07-14** — Global search / command palette (`feature/global-search`): Cmd/Ctrl+K cmdk palette, client-side fuzzy search.
- **2026-07-14** — Pagination (`feature/pagination`): server-side `?page=` on item/collection lists, `src/lib/pagination.ts`.
- **2026-07-15** — Settings page (`feature/settings-page`): `/settings`; moved account actions from profile.
- **2026-07-15** — Editor preferences (`feature/editor-preferences`): per-user Monaco prefs (`editorPreferences` JSON col + migration), auto-save.
- **2026-07-15** — Favorites page (`feature/favorites-page`): `/favorites` dense list of favorited items + collections.
- **2026-07-16** — Favorite toggle across surfaces (`feature/favorite-toggle`): drawer + collection detail/cards persist `isFavorite`.
- **2026-07-16** — Favorites page sorting (`feature/favorites-sorting`): per-section sort + localStorage persistence.
- **2026-07-16** — Pinned items (`feature/pinned-items`): drawer Pin toggles/persists `isPinned`, pinned-first sort.
- **2026-07-16** — Homepage mockup (`feature/homepage-mockup`): standalone `prototypes/homepage/` marketing prototype.
- **2026-07-16** — Homepage (`feature/homepage`): ported prototype to Next.js at `/`, marketing components.
- **2026-07-17** — Mobile layout fixes + marketing top bar on auth pages (`fix/mobile-layout-and-auth-nav`).
- **2026-07-17** — Mobile UI review fixes (`fix/ui-review-mobile`): action-bar overflow, footer links, mobile nav, contrast.
- **2026-07-18** — Language dropdown w/ live highlighting (`feature/language-dropdown`): searchable combobox above content.
- **2026-07-18** — AI auto-tagging (`feature/ai-auto-tagging`): first AI feature — OpenAI `gpt-5-nano` Responses API, Pro gate, accept/reject tag chips.
- **2026-07-18** — AI description generator (`feature/ai-description-generator`): Pro-only generate-description button, overwrite + undo.
- **2026-07-19** — AI Explain Code (`feature/ai-explain-code`): Pro-only Explain button, Code/Explain tabs in drawer read view.
- **2026-07-19** — AI Prompt Optimizer (`feature/ai-prompt-optimizer`): Pro-only Optimize button on prompt items — refines the prompt, shows Original/Optimized tabs, accept persists via `updateItem` with Undo; `optimize.ts` lib + `optimizePrompt` action + `aiOptimize` rate limit + `MarkdownEditor` header/overlay slots.
