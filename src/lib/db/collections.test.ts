import { describe, it, expect, vi, beforeEach } from "vitest";

// collections.ts imports @/lib/prisma (throws at load if DATABASE_URL is unset)
// and @/lib/db/helpers (whose requireUserId pulls in @/auth). Mock both so these
// tests need no DB, env, or session. vi.hoisted creates the prisma mock fns
// before the hoisted vi.mock factories run, so they can be referenced inside.
const {
  collectionCreate,
  collectionFindMany,
  collectionFindFirst,
  collectionUpdate,
  collectionDelete,
} = vi.hoisted(() => ({
  collectionCreate: vi.fn(),
  collectionFindMany: vi.fn(),
  collectionFindFirst: vi.fn(),
  collectionUpdate: vi.fn(),
  collectionDelete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      create: collectionCreate,
      findMany: collectionFindMany,
      findFirst: collectionFindFirst,
      update: collectionUpdate,
      delete: collectionDelete,
    },
  },
}));

vi.mock("@/lib/db/helpers", () => ({
  requireUserId: vi.fn(async () => "user_1"),
  toLabel: (name: string) => name.charAt(0).toUpperCase() + name.slice(1),
}));

import {
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionDetail,
  getCollectionOptions,
} from "@/lib/db/collections";

beforeEach(() => {
  vi.clearAllMocks();
  collectionCreate.mockResolvedValue({
    id: "col_1",
    name: "React Patterns",
    description: "Reusable hooks",
    isFavorite: false,
  });
});

describe("createCollection query", () => {
  it("creates the collection scoped to the current user", async () => {
    await createCollection({ name: "React Patterns", description: "Reusable hooks" });

    expect(collectionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "React Patterns",
          description: "Reusable hooks",
          userId: "user_1",
        }),
      }),
    );
  });

  it("returns a DashboardCollection view model with empty item/type data", async () => {
    const result = await createCollection({
      name: "React Patterns",
      description: "Reusable hooks",
    });

    expect(result).toEqual({
      id: "col_1",
      name: "React Patterns",
      description: "Reusable hooks",
      isFavorite: false,
      itemCount: 0,
      types: [],
      primaryColor: "var(--border)",
    });
  });

  it("persists a null description", async () => {
    collectionCreate.mockResolvedValueOnce({
      id: "col_2",
      name: "Empty",
      description: null,
      isFavorite: false,
    });

    const result = await createCollection({ name: "Empty", description: null });

    expect(collectionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: null }),
      }),
    );
    expect(result.description).toBeNull();
  });
});

describe("getCollectionDetail query", () => {
  it("returns null when the id isn't the current user's collection", async () => {
    collectionFindFirst.mockResolvedValue(null);

    const result = await getCollectionDetail("col_x");

    expect(result).toBeNull();
    expect(collectionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "col_x", userId: "user_1" } }),
    );
  });

  it("maps the collection and its items to the detail view model", async () => {
    collectionFindFirst.mockResolvedValue({
      id: "col_1",
      name: "React Patterns",
      description: "Reusable hooks",
      isFavorite: true,
      items: [
        {
          item: {
            id: "item_1",
            title: "useDebounce",
            description: "debounce hook",
            isFavorite: false,
            isPinned: false,
            createdAt: new Date("2026-01-01"),
            fileUrl: null,
            fileName: null,
            fileSize: null,
            itemType: {
              id: "type_1",
              name: "snippet",
              icon: "Code",
              color: "#3b82f6",
            },
            tags: [{ tag: { name: "react" } }],
          },
        },
      ],
    });

    const result = await getCollectionDetail("col_1");

    expect(result).toEqual({
      id: "col_1",
      name: "React Patterns",
      description: "Reusable hooks",
      isFavorite: true,
      itemCount: 1,
      types: [
        expect.objectContaining({
          id: "type_1",
          name: "snippet",
          label: "Snippet",
          count: 1,
        }),
      ],
      items: [
        expect.objectContaining({
          id: "item_1",
          title: "useDebounce",
          tags: ["react"],
          type: expect.objectContaining({
            id: "type_1",
            name: "snippet",
            label: "Snippet",
          }),
        }),
      ],
    });
  });

  it("returns distinct types ordered by frequency (most-common first)", async () => {
    const makeItem = (id: string, typeName: string, typeId: string) => ({
      item: {
        id,
        title: id,
        description: null,
        isFavorite: false,
        isPinned: false,
        createdAt: new Date("2026-01-01"),
        fileUrl: null,
        fileName: null,
        fileSize: null,
        itemType: {
          id: typeId,
          name: typeName,
          icon: "Code",
          color: "#000",
        },
        tags: [],
      },
    });

    collectionFindFirst.mockResolvedValue({
      id: "col_1",
      name: "Mixed",
      description: null,
      isFavorite: false,
      items: [
        makeItem("i1", "link", "t_link"),
        makeItem("i2", "snippet", "t_snip"),
        makeItem("i3", "snippet", "t_snip"),
      ],
    });

    const result = await getCollectionDetail("col_1");

    // snippet appears twice, link once → snippet first, with per-type counts.
    expect(result?.types.map((t) => [t.name, t.count])).toEqual([
      ["snippet", 2],
      ["link", 1],
    ]);
  });

  it("returns empty types/items for a collection with no items", async () => {
    collectionFindFirst.mockResolvedValue({
      id: "col_empty",
      name: "Empty",
      description: null,
      isFavorite: false,
      items: [],
    });

    const result = await getCollectionDetail("col_empty");

    expect(result).toEqual({
      id: "col_empty",
      name: "Empty",
      description: null,
      isFavorite: false,
      itemCount: 0,
      types: [],
      items: [],
    });
  });
});

describe("getCollectionOptions query", () => {
  it("returns the user's collections as { id, name }, scoped and alphabetical", async () => {
    const rows = [
      { id: "c_1", name: "AI Workflows" },
      { id: "c_2", name: "React Patterns" },
    ];
    collectionFindMany.mockResolvedValue(rows);

    const result = await getCollectionOptions();

    expect(collectionFindMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    expect(result).toEqual(rows);
  });
});

describe("updateCollection query", () => {
  it("returns null and does not update when the id isn't the user's", async () => {
    collectionFindFirst.mockResolvedValue(null);

    const result = await updateCollection("col_x", {
      name: "New",
      description: null,
    });

    expect(result).toBeNull();
    expect(collectionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "col_x", userId: "user_1" } }),
    );
    expect(collectionUpdate).not.toHaveBeenCalled();
  });

  it("updates name/description and returns the refreshed view model", async () => {
    collectionFindFirst.mockResolvedValue({ id: "col_1" });
    collectionUpdate.mockResolvedValue({
      id: "col_1",
      name: "Renamed",
      description: "Updated",
      isFavorite: true,
      items: [
        { item: { itemType: { id: "t1", name: "snippet", icon: "Code", color: "#3b82f6" } } },
        { item: { itemType: { id: "t1", name: "snippet", icon: "Code", color: "#3b82f6" } } },
        { item: { itemType: { id: "t2", name: "link", icon: "Link", color: "#10b981" } } },
      ],
    });

    const result = await updateCollection("col_1", {
      name: "Renamed",
      description: "Updated",
    });

    expect(collectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "col_1" },
        data: { name: "Renamed", description: "Updated" },
      }),
    );
    expect(result).toEqual({
      id: "col_1",
      name: "Renamed",
      description: "Updated",
      isFavorite: true,
      itemCount: 3,
      // snippet appears twice → primary, so it leads and tints the border.
      types: [
        expect.objectContaining({ id: "t1", name: "snippet", label: "Snippet" }),
        expect.objectContaining({ id: "t2", name: "link", label: "Link" }),
      ],
      primaryColor: "#3b82f6",
    });
  });
});

describe("deleteCollection query", () => {
  it("returns false and does not delete when the id isn't the user's", async () => {
    collectionFindFirst.mockResolvedValue(null);

    const result = await deleteCollection("col_x");

    expect(result).toBe(false);
    expect(collectionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "col_x", userId: "user_1" } }),
    );
    expect(collectionDelete).not.toHaveBeenCalled();
  });

  it("deletes the owned collection by id and returns true", async () => {
    collectionFindFirst.mockResolvedValue({ id: "col_1" });

    const result = await deleteCollection("col_1");

    expect(collectionDelete).toHaveBeenCalledWith({ where: { id: "col_1" } });
    expect(result).toBe(true);
  });
});
