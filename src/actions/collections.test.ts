import { describe, it, expect, vi, beforeEach } from "vitest";

// The action delegates persistence to lib/db/collections' createCollection
// (which pulls in prisma + auth). Mock it so these tests exercise only the
// action's Zod validation / normalization, with no DB or session.
const { createCollectionQuery } = vi.hoisted(() => ({
  createCollectionQuery: vi.fn(),
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: createCollectionQuery,
}));

import { createCollection } from "@/actions/collections";

// The query's resolved value is passed straight back as `data`.
const okCollection = { id: "col_1", name: "React Patterns" };

beforeEach(() => {
  vi.clearAllMocks();
  createCollectionQuery.mockResolvedValue(okCollection);
});

function input(overrides: Record<string, unknown> = {}) {
  return {
    name: "React Patterns",
    description: "",
    ...overrides,
  };
}

describe("createCollection action — validation", () => {
  it("rejects an empty / whitespace-only name without touching the DB", async () => {
    const result = await createCollection(input({ name: "   " }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Name is required");
    expect(createCollectionQuery).not.toHaveBeenCalled();
  });

  it("trims the name before persisting", async () => {
    await createCollection(input({ name: "  React Patterns  " }));

    expect(createCollectionQuery).toHaveBeenCalledWith(
      expect.objectContaining({ name: "React Patterns" }),
    );
  });

  it("collapses an empty description to null", async () => {
    await createCollection(input({ description: "" }));

    expect(createCollectionQuery).toHaveBeenCalledWith(
      expect.objectContaining({ description: null }),
    );
  });

  it("passes a provided description through", async () => {
    await createCollection(input({ description: "Reusable hooks" }));

    expect(createCollectionQuery).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Reusable hooks" }),
    );
  });
});

describe("createCollection action — result", () => {
  it("returns the created collection on success", async () => {
    const result = await createCollection(input());

    expect(result).toEqual({ success: true, data: okCollection });
  });

  it("returns a generic error when the query throws", async () => {
    createCollectionQuery.mockRejectedValueOnce(new Error("db down"));

    const result = await createCollection(input());

    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
  });
});
