# 📦 DevStash — Project Overview

> **One fast, searchable, AI-enhanced hub for all dev knowledge & resources.**

---

## The Problem

Developers keep their essentials scattered across too many places:

| What | Where |
|------|-------|
| Code snippets | VS Code, Notion |
| AI prompts | Chat history |
| Context files | Buried in project folders |
| Useful links | Browser bookmarks |
| Docs & notes | Random folders |
| CLI commands | `.txt` files, bash history |
| Templates | GitHub Gists |

This creates constant context switching, lost knowledge, and inconsistent workflows. DevStash fixes this with one unified, fast, searchable hub.

---

## Users

| Persona | Needs |
|---------|-------|
| **Everyday Developer** | Fast access to snippets, prompts, commands, links |
| **AI-first Developer** | Saves prompts, system messages, workflows, contexts |
| **Content Creator / Educator** | Code blocks, explanations, course notes |
| **Full-stack Builder** | Patterns, boilerplates, API examples |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/docs) / [React 19](https://react.dev) |
| **Language** | [TypeScript](https://www.typescriptlang.org) |
| **Database** | [Neon](https://neon.tech/docs) (PostgreSQL) |
| **ORM** | [Prisma 7](https://www.prisma.io/docs) |
| **Auth** | [NextAuth v5](https://authjs.dev) (Email/password + GitHub OAuth) |
| **File Storage** | [Cloudflare R2](https://developers.cloudflare.com/r2) |
| **AI** | [OpenAI](https://platform.openai.com/docs) — `gpt-5-nano` |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/docs) + [shadcn/ui](https://ui.shadcn.com) |
| **Payments** | [Stripe](https://stripe.com/docs) |
| **Caching** | [Redis](https://redis.io/docs) *(optional, TBD)* |

> **Migration rule:** Never use `prisma db push`. All schema changes go through versioned migrations (`prisma migrate dev` → `prisma migrate deploy`).

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                             │
│  Next.js App Router                                                  │
│    ├── Server Components  ──────────────────────► Server Actions     │
│    └── Client Components & Drawers ────────────► API Routes         │
└──────────────────────────────────────────────────────┬───────────────┘
                                                       │
                         ┌─────────────────────────────▼──────────────┐
                         │  NEXT.JS BACKEND                           │
                         │   ├── API Routes   (/api/*)                │
                         │   ├── Server Actions                       │
                         │   └── NextAuth v5  (/api/auth/*)           │
                         └──┬──────┬──────┬──────┬──────┬────────────┘
                            │      │      │      │      │
                    ┌───────▼─┐ ┌──▼──┐ ┌▼────┐ ┌▼────┐ ┌▼──────────┐
                    │  Neon   │ │Redis│ │ R2  │ │OpenAI│ │  Stripe  │
                    │  PgSQL  │ │Cache│ │Files│ │  AI  │ │ Billing  │
                    └─────────┘ └─────┘ └─────┘ └──────┘ └──────────┘
                                                              │
                                                    ┌─────────▼────────┐
                                                    │  GitHub OAuth    │
                                                    │  (via NextAuth)  │
                                                    └──────────────────┘
```

Data flow summary:
- Client Components call API Routes (`/api/*`) for mutations and file uploads
- Server Components call Server Actions directly for reads
- API Routes talk to: Neon (data), R2 (files), OpenAI (AI), Stripe (billing), Redis (cache)
- NextAuth handles session management and GitHub OAuth, storing sessions in Neon

---

## Data Model

### Relationships

```
User
 ├── has many  Account          (NextAuth OAuth accounts)
 ├── has many  Session          (NextAuth sessions)
 ├── has many  Item             (all items the user owns)
 ├── has many  Collection       (all collections the user owns)
 ├── has many  ItemType         (user's custom types; system types have userId=null)
 └── has many  Tag              (user-scoped tags)

Item
 ├── belongs to  User
 ├── belongs to  ItemType
 ├── has many    ItemCollection  (join → many Collections)
 └── has many    ItemTag         (join → many Tags)

Collection
 ├── belongs to  User
 └── has many    ItemCollection  (join → many Items)

ItemCollection  [join table]
 ├── itemId       → Item
 ├── collectionId → Collection
 └── addedAt

ItemTag  [join table]
 ├── itemId → Item
 └── tagId  → Tag

ItemType
 ├── userId (null = system type, set = custom user type)
 └── has many Items
```

### Model Fields

**User**
```
id                   String   (cuid, PK)
name                 String?
email                String   (unique)
emailVerified        DateTime?
image                String?
password             String?  (bcrypt; null for OAuth-only users)
isPro                Boolean  (default: false)
stripeCustomerId     String?  (unique)
stripeSubscriptionId String?  (unique)
createdAt            DateTime
updatedAt            DateTime
```

**Item**
```
id          String      (cuid, PK)
title       String
contentType ContentType (TEXT | FILE | URL)
content     String?     (text content; null for FILE/URL)
fileUrl     String?     (Cloudflare R2 URL; null for TEXT/URL)
fileName    String?     (original upload filename)
fileSize    Int?        (bytes)
url         String?     (for link types only)
description String?
language    String?     (e.g. "typescript", "python" — for syntax highlighting)
isFavorite  Boolean     (default: false)
isPinned    Boolean     (default: false)
lastUsedAt  DateTime?   (updated on open/copy — powers "Recently Used")
createdAt   DateTime
updatedAt   DateTime
userId      String      (FK → User)
itemTypeId  String      (FK → ItemType)
```

**Collection**
```
id            String   (cuid, PK)
name          String   (e.g. "React Patterns", "Context Files")
description   String?
isFavorite    Boolean  (default: false)
defaultTypeId String?  (FK → ItemType — hint for new items)
createdAt     DateTime
updatedAt     DateTime
userId        String   (FK → User)
```

**ItemType**
```
id       String  (cuid, PK)
name     String  (e.g. "snippet", "prompt", "command")
icon     String  (Lucide icon name e.g. "Code", "Sparkles")
color    String  (hex e.g. "#3b82f6")
isSystem Boolean (default: false — true = cannot be edited/deleted)
userId   String? (null for system types; set for custom user types)
```

**Tag**
```
id     String (cuid, PK)
name   String
userId String (FK → User)
UNIQUE (name, userId)
```

**ItemCollection** (join table)
```
itemId       String   (FK → Item, part of composite PK)
collectionId String   (FK → Collection, part of composite PK)
addedAt      DateTime (default: now)
```

**ItemTag** (join table)
```
itemId String (FK → Item, part of composite PK)
tagId  String (FK → Tag, part of composite PK)
```

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── NextAuth ────────────────────────────────────────────────────────────────

model User {
  id                   String    @id @default(cuid())
  name                 String?
  email                String    @unique
  emailVerified        DateTime?
  image                String?
  password             String?   // bcrypt hashed; null for OAuth-only users
  isPro                Boolean   @default(false)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  accounts    Account[]
  sessions    Session[]
  items       Item[]
  collections Collection[]
  itemTypes   ItemType[]
  tags        Tag[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Core Domain ─────────────────────────────────────────────────────────────

enum ContentType {
  TEXT  // snippet, prompt, note, command
  FILE  // file, image
  URL   // link
}

model ItemType {
  id       String  @id @default(cuid())
  name     String  // "snippet" | "prompt" | "note" | "command" | "file" | "image" | "link"
  icon     String  // Lucide icon name e.g. "Code", "Sparkles", "Terminal"
  color    String  // Hex e.g. "#3b82f6"
  isSystem Boolean @default(false)
  userId   String? // null for system types; set for user-created custom types

  user  User?  @relation(fields: [userId], references: [id], onDelete: Cascade)
  items Item[]

  @@unique([name, userId]) // enforces unique names per user (and for system types)
}

model Item {
  id          String      @id @default(cuid())
  title       String
  contentType ContentType
  content     String?     // text content; null for FILE types
  fileUrl     String?     // Cloudflare R2 public/signed URL; null for TEXT/URL types
  fileName    String?     // original upload filename
  fileSize    Int?        // bytes
  url         String?     // for URL/link types only
  description String?
  language    String?     // e.g. "typescript", "python", "bash" — for syntax highlighting
  isFavorite  Boolean     @default(false)
  isPinned    Boolean     @default(false)
  lastUsedAt  DateTime?   // updated on item open/copy — powers "Recently Used"
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  userId     String
  itemTypeId String

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  itemType    ItemType         @relation(fields: [itemTypeId], references: [id])
  collections ItemCollection[]
  tags        ItemTag[]
}

model Collection {
  id            String   @id @default(cuid())
  name          String   // e.g. "React Patterns", "Context Files"
  description   String?
  isFavorite    Boolean  @default(false)
  defaultTypeId String?  // suggested ItemType for new items added to this collection
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  userId String

  user  User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  items ItemCollection[]
}

model ItemCollection {
  itemId       String
  collectionId String
  addedAt      DateTime @default(now())

  item       Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([itemId, collectionId])
}

model Tag {
  id     String @id @default(cuid())
  name   String
  userId String

  user  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  items ItemTag[]

  @@unique([name, userId])
}

model ItemTag {
  itemId String
  tagId  String

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])
}
```

---

## Item Types

| Icon | Type | Color | Hex | Route | Content Type |
|------|------|-------|-----|-------|--------------|
| `Code` | Snippet | Blue | `#3b82f6` | `/items/snippets` | TEXT |
| `Sparkles` | Prompt | Purple | `#8b5cf6` | `/items/prompts` | TEXT |
| `Terminal` | Command | Orange | `#f97316` | `/items/commands` | TEXT |
| `StickyNote` | Note | Yellow | `#fde047` | `/items/notes` | TEXT |
| `File` | File *(Pro)* | Gray | `#6b7280` | `/items/files` | FILE |
| `Image` | Image *(Pro)* | Pink | `#ec4899` | `/items/images` | FILE |
| `Link` | Link | Emerald | `#10b981` | `/items/links` | URL |

System types (`isSystem: true`) cannot be modified or deleted. Pro-only types are enforced at the API layer (file/image upload routes require `isPro: true`).

---

## Features

### A. Items
- Create/edit/delete items of any type
- Quick-access drawer (open without leaving current view)
- Pin items to top of list
- Favorite individual items
- Track recently used (`lastUsedAt`)
- Import code directly from a file
- Markdown editor for TEXT types
- File upload (R2) for FILE types
- Copy-to-clipboard on text/command items

### B. Collections
- Group items of any type into named collections
- Items can belong to multiple collections simultaneously
- Favorite collections
- `defaultTypeId` hints the type for new items added

### C. Search
Full-text + filter search across:
- Title
- Content
- Tags
- Item type

### D. Authentication
- Email/password (bcrypt hashed)
- GitHub OAuth
- Powered by NextAuth v5

### E. General
- Dark mode default, light mode toggle
- Export data as JSON / ZIP *(Pro)*
- Add/remove items to/from collections via multi-select
- View all collections an item belongs to
- Syntax highlighting for code blocks ([Shiki](https://shiki.style) or [Prism](https://prismjs.com))

### F. AI Features *(Pro only)*
- **Auto-tagging** — suggests tags based on content
- **Summarize** — one-line summary for notes/snippets
- **Explain This Code** — plain-English code breakdown
- **Prompt Optimizer** — rewrites prompts for clarity & performance

> During development all users have full Pro access. Gate Pro features with an `isPro` check that can be toggled per-user.

---

## Monetization

| Feature | Free | Pro ($8/mo or $72/yr) |
|---------|------|----------------------|
| Items | 50 total | Unlimited |
| Collections | 3 | Unlimited |
| Item types | All except file & image | All including file & image |
| Search | Basic | Basic |
| File & image uploads | No | Yes |
| Custom types | No | Yes (coming later) |
| AI auto-tagging | No | Yes |
| AI code explanation | No | Yes |
| AI prompt optimizer | No | Yes |
| Export (JSON / ZIP) | No | Yes |
| Support | Standard | Priority |

Stripe integration: `stripeCustomerId` + `stripeSubscriptionId` stored on `User`. Webhook updates `isPro` on subscription events (`customer.subscription.updated`, `customer.subscription.deleted`).

> During development: all users are treated as Pro. Use `isPro: true` in the dev seed script.

---

## UI / UX

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (collapsible)  │  Main Content              │
│                         │                            │
│  ▸ Snippets             │  [ Collection Cards Grid ] │
│  ▸ Prompts              │                            │
│  ▸ Commands             │  ┌──────┐ ┌──────┐        │
│  ▸ Notes                │  │React │ │AI    │        │
│  ▸ Files (Pro)          │  │Hooks │ │Prompts│       │
│  ▸ Images (Pro)         │  └──────┘ └──────┘        │
│  ▸ Links                │                            │
│  ─────────────────      │  [ Items in collection ]   │
│  Collections            │                            │
│  ▸ React Patterns       │  ┌──────┐ ┌──────┐        │
│  ▸ Context Files        │  │Item  │ │Item  │        │
│  ▸ AI Prompts           │  │card  │ │card  │        │
│                         │  └──────┘ └──────┘        │
└─────────────────────────────────────────────────────┘
                              ↓ click item
                          [ Drawer opens ]
```

- Collection cards: background color = color of the most-common item type in that collection
- Item cards: border color = item type color
- Sidebar collapses to icon rail on mobile

### Design Principles
- References: [Notion](https://notion.so), [Linear](https://linear.app), [Raycast](https://raycast.com)
- Dark mode default — `class="dark"` on `<html>`
- Clean typography, generous whitespace, subtle borders/shadows
- Desktop-first; sidebar becomes bottom drawer on mobile

### Screenshots

Refer to the screenshots below as base for the dashboard UI. It does not have to be exact. Use it as a reference.:

- @context/screenshots/dashboard-ui-main.png
- @context/screenshots/dashboard-ui-drawer.png

### Micro-interactions
- Smooth slide-in drawer for item open/create
- Hover states on all cards
- Toast notifications for CRUD actions
- Loading skeletons on data fetch
- Optimistic UI updates where possible

---

## URL Structure

| Route | Description |
|-------|-------------|
| `/` | Dashboard / home |
| `/items` | All items |
| `/items/snippets` | Filtered by type |
| `/items/prompts` | Filtered by type |
| `/items/commands` | Filtered by type |
| `/items/notes` | Filtered by type |
| `/items/files` | Filtered by type *(Pro)* |
| `/items/images` | Filtered by type *(Pro)* |
| `/items/links` | Filtered by type |
| `/collections` | All collections |
| `/collections/[id]` | Single collection view |
| `/settings` | User settings, billing |
| `/api/items` | Items CRUD |
| `/api/collections` | Collections CRUD |
| `/api/upload` | R2 file upload |
| `/api/ai/[action]` | AI endpoints (tag, explain, summarize, optimize) |
| `/api/webhooks/stripe` | Stripe webhook handler |

---

## Environment Variables

```env
# Database
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Redis (optional)
REDIS_URL=
```

---

## Development Notes

- All migrations via `prisma migrate dev` (dev) and `prisma migrate deploy` (prod) — never `db push`
- During development, bypass `isPro` gates with a feature flag or seed all dev users with `isPro: true`
- Pro-only file/image upload types are enforced server-side on API routes, not just UI
- `ItemType` system types are seeded via a Prisma seed script and have `userId: null` + `isSystem: true`
- R2 file access: use signed URLs for private files, public bucket URL for images