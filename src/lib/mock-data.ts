// Single source of truth for mock data used by the dashboard UI.
// This is temporary scaffolding until the database (Prisma/Neon) is wired up.
// Shapes loosely follow the Prisma models in context/project-overview.md.

export type ContentType = "TEXT" | "FILE" | "URL";

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
}

export interface ItemType {
  id: string;
  name: string; // "snippet" | "prompt" | "command" | "note" | "file" | "image" | "link"
  label: string; // display name, e.g. "Snippets"
  icon: string; // Lucide icon name, e.g. "Code"
  color: string; // hex, e.g. "#3b82f6"
  isSystem: boolean;
  count: number; // number of items of this type (for the sidebar)
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  itemTypeIds: string[]; // types present in this collection (for card icons)
}

export interface Item {
  id: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  content: string | null;
  language: string | null;
  itemTypeId: string;
  collectionIds: string[];
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string; // ISO date
}

// ─── Current logged-in user ──────────────────────────────────────────────────

export const currentUser: User = {
  id: "user_1",
  name: "John Doe",
  email: "john@example.com",
  image: null,
  isPro: true,
};

// ─── Item types (system types) ───────────────────────────────────────────────

export const itemTypes: ItemType[] = [
  { id: "type_snippet", name: "snippet", label: "Snippets", icon: "Code", color: "#3b82f6", isSystem: true, count: 24 },
  { id: "type_prompt", name: "prompt", label: "Prompts", icon: "Sparkles", color: "#8b5cf6", isSystem: true, count: 18 },
  { id: "type_command", name: "command", label: "Commands", icon: "Terminal", color: "#f97316", isSystem: true, count: 15 },
  { id: "type_note", name: "note", label: "Notes", icon: "StickyNote", color: "#fde047", isSystem: true, count: 12 },
  { id: "type_file", name: "file", label: "Files", icon: "File", color: "#6b7280", isSystem: true, count: 5 },
  { id: "type_image", name: "image", label: "Images", icon: "Image", color: "#ec4899", isSystem: true, count: 3 },
  { id: "type_link", name: "link", label: "Links", icon: "Link", color: "#10b981", isSystem: true, count: 8 },
];

// ─── Collections ─────────────────────────────────────────────────────────────

export const collections: Collection[] = [
  {
    id: "col_react",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    itemCount: 12,
    itemTypeIds: ["type_snippet", "type_note", "type_link"],
  },
  {
    id: "col_python",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    itemCount: 8,
    itemTypeIds: ["type_snippet", "type_file"],
  },
  {
    id: "col_context",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    itemCount: 5,
    itemTypeIds: ["type_file", "type_note"],
  },
  {
    id: "col_interview",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    itemCount: 24,
    itemTypeIds: ["type_note", "type_snippet", "type_link", "type_prompt"],
  },
  {
    id: "col_git",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    itemCount: 15,
    itemTypeIds: ["type_command", "type_note"],
  },
  {
    id: "col_ai",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    itemCount: 18,
    itemTypeIds: ["type_prompt", "type_snippet", "type_note"],
  },
];

// ─── Items ───────────────────────────────────────────────────────────────────

export const items: Item[] = [
  {
    id: "item_useauth",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    contentType: "TEXT",
    content: "export function useAuth() {\n  const { data: session } = useSession();\n  return { user: session?.user, isAuthenticated: !!session };\n}",
    language: "typescript",
    itemTypeId: "type_snippet",
    collectionIds: ["col_react"],
    tags: ["react", "auth", "hooks"],
    isFavorite: true,
    isPinned: true,
    createdAt: "2026-01-15",
  },
  {
    id: "item_api_error",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    contentType: "TEXT",
    content: "async function fetchWithRetry(url, options, retries = 3) {\n  // exponential backoff retry logic\n}",
    language: "typescript",
    itemTypeId: "type_snippet",
    collectionIds: ["col_react", "col_python"],
    tags: ["fetch", "error-handling", "retry"],
    isFavorite: false,
    isPinned: true,
    createdAt: "2026-01-12",
  },
  {
    id: "item_git_undo",
    title: "Undo Last Commit",
    description: "Soft reset to undo the last commit but keep changes",
    contentType: "TEXT",
    content: "git reset --soft HEAD~1",
    language: "bash",
    itemTypeId: "type_command",
    collectionIds: ["col_git"],
    tags: ["git", "reset"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-10",
  },
  {
    id: "item_refactor_prompt",
    title: "Refactor Prompt",
    description: "Prompt for refactoring code while preserving behavior",
    contentType: "TEXT",
    content: "Refactor the following code for readability and performance without changing its behavior:",
    language: null,
    itemTypeId: "type_prompt",
    collectionIds: ["col_ai"],
    tags: ["ai", "refactor"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2026-01-08",
  },
  {
    id: "item_usedebounce",
    title: "useDebounce Hook",
    description: "Debounce a fast-changing value in React",
    contentType: "TEXT",
    content: "export function useDebounce<T>(value: T, delay = 300) {\n  const [debounced, setDebounced] = useState(value);\n  // ...\n  return debounced;\n}",
    language: "typescript",
    itemTypeId: "type_snippet",
    collectionIds: ["col_react"],
    tags: ["react", "hooks", "performance"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-05",
  },
  {
    id: "item_nextjs_context",
    title: "Next.js Project Context",
    description: "AI context file describing the Next.js project setup",
    contentType: "FILE",
    content: null,
    language: null,
    itemTypeId: "type_file",
    collectionIds: ["col_context"],
    tags: ["nextjs", "context"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2026-01-03",
  },
];
