import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import ws from "ws";
import { ContentType, PrismaClient } from "../src/generated/prisma/client";

// Neon serverless driver talks over WebSockets; provide one for the Node runtime.
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

// The seven built-in item types. System types have userId = null and
// isSystem = true (cannot be edited or deleted by users).
// Mirrors the "Item Types" table in context/project-overview.md.
const SYSTEM_ITEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
];

const DEMO_USER = {
  email: "demo@devstash.io",
  name: "Demo User",
  password: "12345678",
};

// ─── Sample data definition ──────────────────────────────────────────────────
// Each item references a system item type by name. contentType is derived from
// the type: snippet/prompt/command/note → TEXT, link → URL, file/image → FILE.

type SeedItem = {
  type: string;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  language?: string;
  tags?: string[];
};

type SeedCollection = {
  name: string;
  description: string;
  isFavorite?: boolean;
  items: SeedItem[];
};

const SEED_COLLECTIONS: SeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    isFavorite: true,
    items: [
      {
        type: "snippet",
        title: "useDebounce hook",
        description: "Debounce a fast-changing value (e.g. a search input).",
        language: "typescript",
        tags: ["react", "hooks", "typescript"],
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}`,
      },
      {
        type: "snippet",
        title: "Typed Context provider",
        description:
          "A compound Context provider with a hook that throws when used outside its provider.",
        language: "typescript",
        tags: ["react", "context", "typescript"],
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

type ThemeContextValue = {
  theme: "light" | "dark";
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}`,
      },
      {
        type: "snippet",
        title: "cn() classname utility",
        description:
          "Merge conditional Tailwind classes with clsx + tailwind-merge.",
        language: "typescript",
        tags: ["utility", "tailwind", "typescript"],
        content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    items: [
      {
        type: "prompt",
        title: "Code review prompt",
        description: "Ask an LLM for a focused, actionable code review.",
        tags: ["ai", "code-review"],
        content: `You are a senior engineer reviewing a pull request.

Review the diff below for:
1. Correctness bugs and edge cases
2. Security issues (auth, input validation, injection)
3. Performance (N+1 queries, unnecessary re-renders)
4. Readability and adherence to existing patterns

For each finding, give the file/line, severity (low/med/high), and a concrete fix.
Be concise. Skip nitpicks unless they affect correctness.

Diff:
"""
{{DIFF}}
"""`,
      },
      {
        type: "prompt",
        title: "Documentation generator",
        description: "Generate reference docs from a source file.",
        tags: ["ai", "documentation"],
        content: `Generate developer documentation for the code below.

Include:
- A one-paragraph overview of what it does
- Each exported function/type: signature, parameters, return value, and a short example
- Any gotchas or side effects

Write in Markdown. Keep examples runnable and minimal.

Code:
"""
{{CODE}}
"""`,
      },
      {
        type: "prompt",
        title: "Refactoring assistant",
        description: "Refactor code without changing its behavior.",
        tags: ["ai", "refactoring"],
        content: `Refactor the code below to improve clarity and maintainability WITHOUT changing its observable behavior.

Constraints:
- Preserve the public API and all outputs
- Prefer small, focused functions (< 50 lines)
- Remove dead code and duplication
- Keep the existing style and naming conventions

Explain each change in one line, then output the full refactored code.

Code:
"""
{{CODE}}
"""`,
      },
    ],
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    items: [
      {
        type: "snippet",
        title: "Multi-stage Node Dockerfile",
        description: "Lean production image for a Next.js app.",
        language: "dockerfile",
        tags: ["docker", "ci-cd"],
        content: `# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]`,
      },
      {
        type: "command",
        title: "Deploy migrations then app",
        description: "Run Prisma migrations before starting in production.",
        language: "bash",
        tags: ["deployment", "prisma"],
        content: `npx prisma migrate deploy && npm run start`,
      },
      {
        type: "link",
        title: "Docker documentation",
        description: "Official Docker docs and reference.",
        url: "https://docs.docker.com",
        tags: ["docker", "reference"],
      },
      {
        type: "link",
        title: "GitHub Actions documentation",
        description: "Workflow syntax and CI/CD reference.",
        url: "https://docs.github.com/en/actions",
        tags: ["ci-cd", "reference"],
      },
    ],
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    isFavorite: true,
    items: [
      {
        type: "command",
        title: "Undo last commit (keep changes)",
        description: "Reset the last commit but keep the work in your tree.",
        language: "bash",
        tags: ["git"],
        content: `git reset --soft HEAD~1`,
      },
      {
        type: "command",
        title: "Remove all stopped containers",
        description: "Prune stopped Docker containers to reclaim space.",
        language: "bash",
        tags: ["docker"],
        content: `docker container prune -f`,
      },
      {
        type: "command",
        title: "Find process on a port",
        description: "Show which process is listening on port 3000.",
        language: "bash",
        tags: ["process"],
        content: `lsof -i :3000`,
      },
      {
        type: "command",
        title: "List globally installed packages",
        description: "Show top-level npm packages installed globally.",
        language: "bash",
        tags: ["npm"],
        content: `npm list -g --depth=0`,
      },
    ],
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    items: [
      {
        type: "link",
        title: "Tailwind CSS documentation",
        description: "Utility-first CSS framework reference.",
        url: "https://tailwindcss.com/docs",
        tags: ["css", "tailwind", "reference"],
      },
      {
        type: "link",
        title: "shadcn/ui",
        description: "Copy-paste React component library built on Radix.",
        url: "https://ui.shadcn.com",
        tags: ["components", "react"],
      },
      {
        type: "link",
        title: "Radix UI",
        description: "Unstyled, accessible component primitives.",
        url: "https://www.radix-ui.com",
        tags: ["components", "design-system"],
      },
      {
        type: "link",
        title: "Lucide icons",
        description: "Open-source icon library used across DevStash.",
        url: "https://lucide.dev",
        tags: ["icons"],
      },
    ],
  },
];

function contentTypeFor(typeName: string): ContentType {
  if (typeName === "link") return ContentType.URL;
  if (typeName === "file" || typeName === "image") return ContentType.FILE;
  return ContentType.TEXT;
}

async function seedSystemItemTypes() {
  for (const type of SYSTEM_ITEM_TYPES) {
    // Idempotent by hand: the (name, userId) unique index treats NULL userIds
    // as distinct in Postgres, so upsert can't dedupe system types.
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    });

    if (existing) {
      await prisma.itemType.update({
        where: { id: existing.id },
        data: { icon: type.icon, color: type.color, isSystem: true },
      });
    } else {
      await prisma.itemType.create({
        data: { ...type, isSystem: true, userId: null },
      });
    }
  }

  console.log(`Seeded ${SYSTEM_ITEM_TYPES.length} system item types.`);
}

async function seedDemoData() {
  // Idempotent: upsert the demo user by their unique email.
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    // Pro so the demo account can exercise Pro features (AI, uploads) in dev —
    // the project overview treats all dev users as Pro.
    update: { name: DEMO_USER.name, password: passwordHash, isPro: true },
    create: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password: passwordHash,
      isPro: true,
      emailVerified: new Date(),
    },
  });

  // Wipe and rebuild this user's content so re-runs stay clean. Cascades remove
  // the ItemCollection / ItemTag join rows automatically.
  await prisma.item.deleteMany({ where: { userId: user.id } });
  await prisma.collection.deleteMany({ where: { userId: user.id } });
  await prisma.tag.deleteMany({ where: { userId: user.id } });

  // Resolve system item types by name → id.
  const types = await prisma.itemType.findMany({ where: { userId: null } });
  const typeIdByName = new Map(types.map((t) => [t.name, t.id]));

  // Tag cache so each (name, userId) is created once and reused.
  const tagIdByName = new Map<string, string>();
  const tagIdFor = async (name: string) => {
    const cached = tagIdByName.get(name);
    if (cached) return cached;
    const tag = await prisma.tag.create({
      data: { name, userId: user.id },
    });
    tagIdByName.set(name, tag.id);
    return tag.id;
  };

  let itemCount = 0;

  for (const collection of SEED_COLLECTIONS) {
    const created = await prisma.collection.create({
      data: {
        name: collection.name,
        description: collection.description,
        isFavorite: collection.isFavorite ?? false,
        userId: user.id,
      },
    });

    for (const item of collection.items) {
      const itemTypeId = typeIdByName.get(item.type);
      if (!itemTypeId) {
        throw new Error(`Unknown item type "${item.type}" — is it seeded?`);
      }

      const tagIds = await Promise.all((item.tags ?? []).map(tagIdFor));

      await prisma.item.create({
        data: {
          title: item.title,
          description: item.description,
          content: item.content,
          url: item.url,
          language: item.language,
          contentType: contentTypeFor(item.type),
          userId: user.id,
          itemTypeId,
          collections: {
            create: { collectionId: created.id },
          },
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
      });
      itemCount += 1;
    }
  }

  console.log(
    `Seeded demo user (${DEMO_USER.email}) with ${SEED_COLLECTIONS.length} collections, ` +
      `${itemCount} items, and ${tagIdByName.size} tags.`,
  );
}

async function main() {
  await seedSystemItemTypes();
  await seedDemoData();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
