import { describe, it, expect, vi, beforeEach } from "vitest";

// collections.ts imports @/lib/prisma (throws at load if DATABASE_URL is unset)
// and @/lib/db/helpers (whose requireUserId pulls in @/auth). Mock both so these
// tests need no DB, env, or session. vi.hoisted creates the prisma mock fns
// before the hoisted vi.mock factories run, so they can be referenced inside.
const {
  collectionCreate,
  collectionFindMany,
  collectionFindFirst,
  collectionCount,
  collectionUpdate,
  collectionDelete,
  itemCollectionCount,
  itemCollectionFindMany,
  itemGroupBy,
  itemTypeFindMany,
} = vi.hoisted(() => ({
  collectionCreate: vi.fn(),
  collectionFindMany: vi.fn(),
  collectionFindFirst: vi.fn(),
  collectionCount: vi.fn(),
  collectionUpdate: vi.fn(),
  collectionDelete: vi.fn(),
  itemCollectionCount: vi.fn(),
  itemCollectionFindMany: vi.fn(),
  itemGroupBy: vi.fn(),
  itemTypeFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      create: collectionCreate,
      findMany: collectionFindMany,
      findFirst: collectionFindFirst,
      count: collectionCount,
      update: collectionUpdate,
      delete: collectionDelete,
    },
    itemCollection: {
      count: itemCollectionCount,
      findMany: itemCollectionFindMany,
    },
    item: { groupBy: itemGroupBy },
    itemType: { findMany: itemTypeFindMany },
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
  getCollectionsPage,
} from "@/lib/db/collections";
import {
  getPagination,
  ITEMS_PER_PAGE,
  COLLECTIONS_PER_PAGE,
} from "@/lib/pagination";

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
  // A join row `{ item }` as returned by the paginated itemCollection.findMany.
  const joinRow = (id: string, typeId: string, typeName: string) => ({
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
      itemType: { id: typeId, name: typeName, icon: "Code", color: "#3b82f6" },
      tags: [],
    },
  });

  it("returns null (and skips the page fetch) when the id isn't the user's", async () => {
    collectionFindFirst.mockResolvedValue(null);
    itemCollectionCount.mockResolvedValue(0);
    itemGroupBy.mockResolvedValue([]);

    const result = await getCollectionDetail("col_x");

    expect(result).toBeNull();
    expect(collectionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "col_x", userId: "user_1" } }),
    );
    // Ownership fails → we never fetch the page of items.
    expect(itemCollectionFindMany).not.toHaveBeenCalled();
  });

  it("maps the collection and its page of items to the detail view model", async () => {
    collectionFindFirst.mockResolvedValue({
      id: "col_1",
      name: "React Patterns",
      description: "Reusable hooks",
      isFavorite: true,
    });
    itemCollectionCount.mockResolvedValue(1);
    itemGroupBy.mockResolvedValue([{ itemTypeId: "type_1", _count: 1 }]);
    itemTypeFindMany.mockResolvedValue([
      { id: "type_1", name: "snippet", icon: "Code", color: "#3b82f6" },
    ]);
    itemCollectionFindMany.mockResolvedValue([
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
    ]);

    const result = await getCollectionDetail("col_1");

    expect(result).toEqual({
      id: "col_1",
      name: "React Patterns",
      description: "Reusable hooks",
      isFavorite: true,
      itemCount: 1,
      page: 1,
      totalPages: 1,
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

  it("orders the type chips by whole-collection frequency (from groupBy)", async () => {
    collectionFindFirst.mockResolvedValue({
      id: "col_1",
      name: "Mixed",
      description: null,
      isFavorite: false,
    });
    itemCollectionCount.mockResolvedValue(3);
    // groupBy reflects the WHOLE collection, not just the current page.
    itemGroupBy.mockResolvedValue([
      { itemTypeId: "t_link", _count: 1 },
      { itemTypeId: "t_snip", _count: 2 },
    ]);
    itemTypeFindMany.mockResolvedValue([
      { id: "t_link", name: "link", icon: "Link", color: "#10b981" },
      { id: "t_snip", name: "snippet", icon: "Code", color: "#3b82f6" },
    ]);
    itemCollectionFindMany.mockResolvedValue([
      joinRow("i1", "t_link", "link"),
      joinRow("i2", "t_snip", "snippet"),
      joinRow("i3", "t_snip", "snippet"),
    ]);

    const result = await getCollectionDetail("col_1");

    // snippet appears twice, link once → snippet first, with per-type counts.
    expect(result?.types.map((t) => [t.name, t.count])).toEqual([
      ["snippet", 2],
      ["link", 1],
    ]);
  });

  it("fetches only the requested page's slice, keeping the whole-collection count", async () => {
    const total = ITEMS_PER_PAGE * 4 + 1; // spans multiple pages at any size
    const expected = getPagination(2, total, ITEMS_PER_PAGE);
    collectionFindFirst.mockResolvedValue({
      id: "col_1",
      name: "Big",
      description: null,
      isFavorite: false,
    });
    itemCollectionCount.mockResolvedValue(total);
    itemGroupBy.mockResolvedValue([{ itemTypeId: "t_snip", _count: total }]);
    itemTypeFindMany.mockResolvedValue([
      { id: "t_snip", name: "snippet", icon: "Code", color: "#3b82f6" },
    ]);
    itemCollectionFindMany.mockResolvedValue([]);

    const result = await getCollectionDetail("col_1", 2);

    expect(result?.page).toBe(2);
    expect(result?.totalPages).toBe(expected.totalPages);
    // itemCount is the whole collection, not the current page length.
    expect(result?.itemCount).toBe(total);
    // Page 2 skips the first page's rows; scoped to the collection, newest first.
    // Items are paginated by ITEMS_PER_PAGE (they're items, not collections).
    expect(itemCollectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { collectionId: "col_1" },
        orderBy: { addedAt: "desc" },
        skip: expected.skip,
        take: ITEMS_PER_PAGE,
      }),
    );
  });

  it("returns empty types/items for a collection with no items", async () => {
    collectionFindFirst.mockResolvedValue({
      id: "col_empty",
      name: "Empty",
      description: null,
      isFavorite: false,
    });
    itemCollectionCount.mockResolvedValue(0);
    itemGroupBy.mockResolvedValue([]);
    itemCollectionFindMany.mockResolvedValue([]);

    const result = await getCollectionDetail("col_empty");

    expect(result).toEqual({
      id: "col_empty",
      name: "Empty",
      description: null,
      isFavorite: false,
      itemCount: 0,
      page: 1,
      totalPages: 1,
      types: [],
      items: [],
    });
    // No types present → we skip the itemType lookup entirely.
    expect(itemTypeFindMany).not.toHaveBeenCalled();
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

describe("getCollectionsPage query", () => {
  // A collection row as returned by dashboardCollectionInclude (items carry just
  // their itemType, for the card's type tally).
  const collectionRow = (id: string, typeColor = "#3b82f6") => ({
    id,
    name: id,
    description: null,
    isFavorite: false,
    items: [
      { item: { itemType: { id: "t1", name: "snippet", icon: "Code", color: typeColor } } },
    ],
  });

  it("returns one page of the user's collections with page metadata", async () => {
    collectionCount.mockResolvedValue(2);
    collectionFindMany.mockResolvedValue([collectionRow("c_1"), collectionRow("c_2")]);

    const result = await getCollectionsPage();

    expect(collectionCount).toHaveBeenCalledWith({ where: { userId: "user_1" } });
    expect(result.totalCount).toBe(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.collections).toHaveLength(2);
    expect(result.collections[0]).toMatchObject({
      id: "c_1",
      itemCount: 1,
      primaryColor: "#3b82f6",
    });
  });

  it("fetches only the requested page's slice, scoped and newest-first", async () => {
    const total = COLLECTIONS_PER_PAGE * 3 + 1; // spans multiple pages at any size
    const expected = getPagination(2, total, COLLECTIONS_PER_PAGE);
    collectionCount.mockResolvedValue(total);
    collectionFindMany.mockResolvedValue([]);

    const result = await getCollectionsPage(2);

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(expected.totalPages);
    expect(collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1" },
        orderBy: { createdAt: "desc" },
        skip: expected.skip,
        take: COLLECTIONS_PER_PAGE,
      }),
    );
  });

  it("clamps an out-of-range page to the last page", async () => {
    const total = COLLECTIONS_PER_PAGE * 3 + 1;
    const expected = getPagination(999, total, COLLECTIONS_PER_PAGE);
    collectionCount.mockResolvedValue(total);
    collectionFindMany.mockResolvedValue([]);

    const result = await getCollectionsPage(999);

    expect(result.page).toBe(expected.totalPages);
    expect(collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: expected.skip, take: COLLECTIONS_PER_PAGE }),
    );
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
