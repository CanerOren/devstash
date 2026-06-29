import { describe, it, expect, vi, beforeEach } from "vitest";

// items.ts imports @/lib/prisma (throws at load if DATABASE_URL is unset) and
// @/lib/db/helpers (whose requireUserId pulls in @/auth). Mock both so these
// tests need no DB, env, or session. vi.hoisted creates the prisma mock fns
// before the hoisted vi.mock factories run, so they can be referenced inside.
const { findFirst, itemFindMany, itemTypeFindMany } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  itemFindMany: vi.fn(),
  itemTypeFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findFirst, findMany: itemFindMany },
    itemType: { findMany: itemTypeFindMany },
  },
}));

vi.mock("@/lib/db/helpers", () => ({
  requireUserId: vi.fn(async () => "user_1"),
  // Keep the real (trivial) capitalizer so label derivation is exercised.
  toLabel: (name: string) => name.charAt(0).toUpperCase() + name.slice(1),
}));

import { getItemDetail, getItemsByType } from "@/lib/db/items";

// A full prisma row as returned by getItemDetail's include shape.
function detailRow() {
  return {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook",
    contentType: "TEXT" as const,
    content: "export function useAuth() {}",
    url: null,
    fileName: null,
    fileSize: null,
    language: "typescript",
    isFavorite: true,
    isPinned: false,
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-16T00:00:00Z"),
    itemType: { id: "t_snippet", name: "snippet", icon: "Code", color: "#3b82f6" },
    tags: [{ tag: { name: "react" } }, { tag: { name: "auth" } }],
    collections: [{ collection: { id: "c1", name: "React Patterns" } }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getItemDetail", () => {
  it("returns null when the item isn't found (or isn't the user's)", async () => {
    findFirst.mockResolvedValue(null);
    expect(await getItemDetail("missing")).toBeNull();
  });

  it("scopes the lookup to the session user and the requested id", async () => {
    findFirst.mockResolvedValue(detailRow());
    await getItemDetail("item_1");
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item_1", userId: "user_1" } }),
    );
  });

  it("maps the row to the view model: flattens tags/collections, derives the type label", async () => {
    findFirst.mockResolvedValue(detailRow());
    const detail = await getItemDetail("item_1");

    expect(detail).toEqual({
      id: "item_1",
      title: "useAuth Hook",
      description: "Custom authentication hook",
      contentType: "TEXT",
      content: "export function useAuth() {}",
      url: null,
      fileName: null,
      fileSize: null,
      language: "typescript",
      isFavorite: true,
      isPinned: false,
      createdAt: new Date("2024-01-15T00:00:00Z"),
      updatedAt: new Date("2024-01-16T00:00:00Z"),
      tags: ["react", "auth"],
      type: {
        id: "t_snippet",
        name: "snippet",
        label: "Snippet",
        icon: "Code",
        color: "#3b82f6",
      },
      collections: [{ id: "c1", name: "React Patterns" }],
    });
  });
});

describe("getItemsByType", () => {
  const systemTypes = [
    { id: "t_snippet", name: "snippet", icon: "Code", color: "#3b82f6" },
    { id: "t_note", name: "note", icon: "StickyNote", color: "#fde047" },
  ];

  it("returns null for a slug that matches no system type", async () => {
    itemTypeFindMany.mockResolvedValue(systemTypes);
    expect(await getItemsByType("bananas")).toBeNull();
    // No item query when the slug doesn't resolve.
    expect(itemFindMany).not.toHaveBeenCalled();
  });

  it("resolves the plural slug to its type and returns the user's items of that type", async () => {
    itemTypeFindMany.mockResolvedValue(systemTypes);
    itemFindMany.mockResolvedValue([
      {
        id: "item_1",
        title: "useAuth Hook",
        description: null,
        isFavorite: false,
        isPinned: false,
        createdAt: new Date("2024-01-15T00:00:00Z"),
        itemType: systemTypes[0],
        tags: [],
      },
    ]);

    const result = await getItemsByType("snippets");

    expect(result?.type).toMatchObject({ name: "snippet", label: "Snippet" });
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0]).toMatchObject({ id: "item_1", tags: [] });
    // Scoped to the user and the resolved type id.
    expect(itemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1", itemTypeId: "t_snippet" },
      }),
    );
  });
});
