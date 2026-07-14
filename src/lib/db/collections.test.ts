import { describe, it, expect, vi, beforeEach } from "vitest";

// collections.ts imports @/lib/prisma (throws at load if DATABASE_URL is unset)
// and @/lib/db/helpers (whose requireUserId pulls in @/auth). Mock both so these
// tests need no DB, env, or session. vi.hoisted creates the prisma mock fns
// before the hoisted vi.mock factories run, so they can be referenced inside.
const { collectionCreate, collectionFindMany } = vi.hoisted(() => ({
  collectionCreate: vi.fn(),
  collectionFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: { create: collectionCreate, findMany: collectionFindMany },
  },
}));

vi.mock("@/lib/db/helpers", () => ({
  requireUserId: vi.fn(async () => "user_1"),
  toLabel: (name: string) => name.charAt(0).toUpperCase() + name.slice(1),
}));

import { createCollection, getCollectionOptions } from "@/lib/db/collections";

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
