import { describe, it, expect, vi, beforeEach } from "vitest";

// items.ts imports @/lib/prisma (throws at load if DATABASE_URL is unset) and
// @/lib/db/helpers (whose requireUserId pulls in @/auth). Mock both so these
// tests need no DB, env, or session. vi.hoisted creates the prisma mock fns
// before the hoisted vi.mock factories run, so they can be referenced inside.
const {
  findFirst,
  itemFindMany,
  itemCreate,
  itemUpdate,
  itemDelete,
  itemTypeFindMany,
  itemTypeFindFirst,
  deleteFromR2ByUrl,
} = vi.hoisted(() => ({
  findFirst: vi.fn(),
  itemFindMany: vi.fn(),
  itemCreate: vi.fn(),
  itemUpdate: vi.fn(),
  itemDelete: vi.fn(),
  itemTypeFindMany: vi.fn(),
  itemTypeFindFirst: vi.fn(),
  deleteFromR2ByUrl: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst,
      findMany: itemFindMany,
      create: itemCreate,
      update: itemUpdate,
      delete: itemDelete,
    },
    itemType: { findMany: itemTypeFindMany, findFirst: itemTypeFindFirst },
  },
}));

vi.mock("@/lib/db/helpers", () => ({
  requireUserId: vi.fn(async () => "user_1"),
  // Keep the real (trivial) capitalizer so label derivation is exercised.
  toLabel: (name: string) => name.charAt(0).toUpperCase() + name.slice(1),
}));

// r2.ts pulls in @aws-sdk/client-s3; mock it so deleteItem's cleanup is
// observable without touching storage.
vi.mock("@/lib/r2", () => ({ deleteFromR2ByUrl }));

import {
  getItemDetail,
  getItemFileRef,
  getItemsByType,
  createItem,
  updateItem,
  deleteItem,
  toCreatableTypes,
} from "@/lib/db/items";

// A full prisma row as returned by getItemDetail's include shape.
function detailRow() {
  return {
    id: "item_1",
    title: "useAuth Hook",
    description: "Custom authentication hook",
    contentType: "TEXT" as const,
    content: "export function useAuth() {}",
    url: null,
    fileUrl: null,
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
      fileUrl: null,
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

describe("getItemFileRef", () => {
  it("returns null when the item isn't found (or isn't the user's)", async () => {
    findFirst.mockResolvedValue(null);
    expect(await getItemFileRef("missing")).toBeNull();
  });

  it("scopes the lookup to the session user and selects only the file fields", async () => {
    findFirst.mockResolvedValue({
      contentType: "FILE",
      fileUrl: "https://cdn/u1/a.pdf",
      fileName: "a.pdf",
    });
    await getItemFileRef("item_1");
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "item_1", userId: "user_1" },
      select: { contentType: true, fileUrl: true, fileName: true },
    });
  });

  it("returns the file reference row as-is", async () => {
    const row = {
      contentType: "FILE" as const,
      fileUrl: "https://cdn/u1/a.pdf",
      fileName: "a.pdf",
    };
    findFirst.mockResolvedValue(row);
    expect(await getItemFileRef("item_1")).toEqual(row);
  });
});

describe("createItem", () => {
  const base = {
    title: "New Snippet",
    description: null,
    content: "code",
    url: null,
    language: "typescript",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    tags: ["react", "hooks"],
  };

  it("returns null without creating when the type name isn't a system type", async () => {
    itemTypeFindFirst.mockResolvedValue(null);
    expect(await createItem({ typeName: "bogus", ...base })).toBeNull();
    expect(itemCreate).not.toHaveBeenCalled();
  });

  it("derives contentType TEXT for a text type and connect-or-creates tags scoped to the user", async () => {
    itemTypeFindFirst.mockResolvedValue({ id: "t_snippet" });
    itemCreate.mockResolvedValue({ id: "item_1" });
    findFirst.mockResolvedValue(detailRow()); // getItemDetail refetch

    const result = await createItem({ typeName: "snippet", ...base });

    expect(itemTypeFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: "snippet", isSystem: true } }),
    );
    expect(itemCreate).toHaveBeenCalledWith({
      data: {
        title: "New Snippet",
        description: null,
        content: "code",
        url: null,
        language: "typescript",
        fileUrl: null,
        fileName: null,
        fileSize: null,
        contentType: "TEXT",
        userId: "user_1",
        itemTypeId: "t_snippet",
        tags: {
          create: [
            {
              tag: {
                connectOrCreate: {
                  where: { name_userId: { name: "react", userId: "user_1" } },
                  create: { name: "react", userId: "user_1" },
                },
              },
            },
            {
              tag: {
                connectOrCreate: {
                  where: { name_userId: { name: "hooks", userId: "user_1" } },
                  create: { name: "hooks", userId: "user_1" },
                },
              },
            },
          ],
        },
      },
      select: { id: true },
    });
    // Returns the refreshed detail from the post-create refetch.
    expect(result?.id).toBe("item_1");
  });

  it("derives contentType URL for a link type", async () => {
    itemTypeFindFirst.mockResolvedValue({ id: "t_link" });
    itemCreate.mockResolvedValue({ id: "item_2" });
    findFirst.mockResolvedValue(detailRow());

    await createItem({
      typeName: "link",
      title: "Docs",
      description: null,
      content: null,
      url: "https://example.com",
      language: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      tags: [],
    });

    expect(itemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contentType: "URL",
          url: "https://example.com",
          itemTypeId: "t_link",
        }),
      }),
    );
  });

  it("derives contentType FILE for file/image and persists the R2 metadata", async () => {
    itemTypeFindFirst.mockResolvedValue({ id: "t_image" });
    itemCreate.mockResolvedValue({ id: "item_3" });
    findFirst.mockResolvedValue(detailRow());

    await createItem({
      typeName: "image",
      title: "Logo",
      description: null,
      content: null,
      url: null,
      language: null,
      fileUrl: "https://cdn.example.com/user_1/abc-logo.png",
      fileName: "logo.png",
      fileSize: 2048,
      tags: [],
    });

    expect(itemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contentType: "FILE",
          fileUrl: "https://cdn.example.com/user_1/abc-logo.png",
          fileName: "logo.png",
          fileSize: 2048,
          itemTypeId: "t_image",
        }),
      }),
    );
  });
});

describe("updateItem", () => {
  const data = {
    title: "New Title",
    description: null,
    content: "code",
    url: null,
    language: "typescript",
    tags: ["react", "hooks"],
  };

  it("returns null without writing when the item isn't the user's", async () => {
    findFirst.mockResolvedValue(null); // ownership check fails
    expect(await updateItem("item_1", data)).toBeNull();
    expect(itemUpdate).not.toHaveBeenCalled();
  });

  it("replaces tag rows via deleteMany + connect-or-create keyed by (name, userId)", async () => {
    findFirst
      .mockResolvedValueOnce({ id: "item_1" }) // ownership check
      .mockResolvedValueOnce(detailRow()); // getItemDetail refetch
    itemUpdate.mockResolvedValue({ id: "item_1" });

    const result = await updateItem("item_1", data);

    expect(itemUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: {
        title: "New Title",
        description: null,
        content: "code",
        url: null,
        language: "typescript",
        tags: {
          deleteMany: {},
          create: [
            {
              tag: {
                connectOrCreate: {
                  where: { name_userId: { name: "react", userId: "user_1" } },
                  create: { name: "react", userId: "user_1" },
                },
              },
            },
            {
              tag: {
                connectOrCreate: {
                  where: { name_userId: { name: "hooks", userId: "user_1" } },
                  create: { name: "hooks", userId: "user_1" },
                },
              },
            },
          ],
        },
      },
    });
    // Returns the refreshed detail from the post-update refetch.
    expect(result?.id).toBe("item_1");
  });
});

describe("deleteItem", () => {
  it("returns false without deleting when the item isn't the user's", async () => {
    findFirst.mockResolvedValue(null); // ownership check fails
    expect(await deleteItem("item_1")).toBe(false);
    expect(itemDelete).not.toHaveBeenCalled();
  });

  it("scopes the ownership check to the session user and the requested id", async () => {
    findFirst.mockResolvedValue(null);
    await deleteItem("item_1");
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item_1", userId: "user_1" } }),
    );
  });

  it("deletes by id and returns true when the item is the user's", async () => {
    // No fileUrl → nothing to clean up in R2.
    findFirst.mockResolvedValue({ id: "item_1", fileUrl: null });
    itemDelete.mockResolvedValue({ id: "item_1" });

    expect(await deleteItem("item_1")).toBe(true);
    expect(itemDelete).toHaveBeenCalledWith({ where: { id: "item_1" } });
    expect(deleteFromR2ByUrl).not.toHaveBeenCalled();
  });

  it("removes the backing R2 object after deleting a FILE item's row", async () => {
    findFirst.mockResolvedValue({
      id: "item_1",
      fileUrl: "https://cdn.example.com/user_1/abc-logo.png",
    });
    itemDelete.mockResolvedValue({ id: "item_1" });

    expect(await deleteItem("item_1")).toBe(true);
    // Row deleted first, then the object (best-effort).
    expect(itemDelete).toHaveBeenCalledWith({ where: { id: "item_1" } });
    expect(deleteFromR2ByUrl).toHaveBeenCalledWith(
      "https://cdn.example.com/user_1/abc-logo.png",
    );
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

describe("toCreatableTypes", () => {
  const types = [
    { name: "snippet", icon: "Code", color: "#3b82f6" },
    { name: "note", icon: "StickyNote", color: "#fde047" },
    { name: "file", icon: "File", color: "#6b7280" },
    { name: "image", icon: "Image", color: "#ec4899" },
    { name: "link", icon: "Link", color: "#10b981" },
  ];

  it("includes all system types (file/image included) in canonical order", () => {
    const names = toCreatableTypes(types).map((t) => t.name);
    // TYPE_ORDER: snippet → note → file → image → link (of the ones passed).
    expect(names).toEqual(["snippet", "note", "file", "image", "link"]);
  });

  it("derives a singular capitalized label and carries icon/color through", () => {
    const [snippet] = toCreatableTypes(types);
    expect(snippet).toEqual({
      name: "snippet",
      label: "Snippet",
      icon: "Code",
      color: "#3b82f6",
    });
  });
});
