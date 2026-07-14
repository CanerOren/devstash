import { describe, it, expect, vi, beforeEach } from "vitest";

// search.ts imports @/lib/prisma (throws at load if DATABASE_URL is unset) and,
// transitively via items.ts, @/lib/db/helpers (whose requireUserId pulls in
// @/auth). Mock both so these tests need no DB, env, or session. vi.hoisted
// creates the prisma mocks before the hoisted vi.mock factories run.
const { itemFindMany, collectionFindMany, requireUserId } = vi.hoisted(() => ({
  itemFindMany: vi.fn(),
  collectionFindMany: vi.fn(),
  requireUserId: vi.fn(async () => "user_1"),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findMany: itemFindMany },
    collection: { findMany: collectionFindMany },
  },
}));

vi.mock("@/lib/db/helpers", () => ({
  requireUserId,
  // Keep the real (trivial) capitalizer so label derivation is exercised.
  toLabel: (name: string) => name.charAt(0).toUpperCase() + name.slice(1),
}));

import { getSearchData } from "@/lib/db/search";

// An item row as returned by the shared itemInclude shape (all scalars + type +
// tags). `content` is present because the fetcher uses `include`, not `select`.
function itemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook",
    content: "export function useAuth() {}",
    isFavorite: false,
    isPinned: false,
    createdAt: new Date("2024-01-15T00:00:00Z"),
    fileUrl: null,
    fileName: null,
    fileSize: null,
    itemType: {
      id: "t_snippet",
      name: "snippet",
      icon: "Code",
      color: "#3b82f6",
    },
    tags: [{ tag: { name: "react" } }, { tag: { name: "auth" } }],
    ...overrides,
  };
}

describe("getSearchData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserId.mockResolvedValue("user_1");
  });

  it("scopes both queries to the current user", async () => {
    itemFindMany.mockResolvedValue([]);
    collectionFindMany.mockResolvedValue([]);

    await getSearchData();

    expect(itemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
    expect(collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" } }),
    );
  });

  it("maps items to SearchItem with a resolved type, flattened tags, and a content preview", async () => {
    itemFindMany.mockResolvedValue([itemRow()]);
    collectionFindMany.mockResolvedValue([]);

    const { items } = await getSearchData();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "item_1",
      title: "useAuth Hook",
      tags: ["react", "auth"],
      contentPreview: "export function useAuth() {}",
      type: { name: "snippet", label: "Snippet", color: "#3b82f6" },
    });
  });

  it("truncates the content preview to 200 chars and tolerates null content", async () => {
    const long = "x".repeat(500);
    itemFindMany.mockResolvedValue([
      itemRow({ id: "a", content: long }),
      itemRow({ id: "b", content: null }),
    ]);
    collectionFindMany.mockResolvedValue([]);

    const { items } = await getSearchData();

    expect(items[0].contentPreview).toHaveLength(200);
    expect(items[1].contentPreview).toBe("");
  });

  it("maps collections to SearchCollection with the item count from _count", async () => {
    itemFindMany.mockResolvedValue([]);
    collectionFindMany.mockResolvedValue([
      { id: "c1", name: "React Patterns", _count: { items: 3 } },
      { id: "c2", name: "Empty", _count: { items: 0 } },
    ]);

    const { collections } = await getSearchData();

    expect(collections).toEqual([
      { id: "c1", name: "React Patterns", itemCount: 3 },
      { id: "c2", name: "Empty", itemCount: 0 },
    ]);
  });
});
