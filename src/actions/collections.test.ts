import { describe, it, expect, vi, beforeEach } from "vitest";

// The actions delegate persistence to lib/db/collections (which pulls in prisma
// + auth). Mock the query layer so these tests exercise only the actions' Zod
// validation / normalization, with no DB or session.
const { createCollectionQuery, updateCollectionQuery, deleteCollectionQuery } =
  vi.hoisted(() => ({
    createCollectionQuery: vi.fn(),
    updateCollectionQuery: vi.fn(),
    deleteCollectionQuery: vi.fn(),
  }));

vi.mock("@/lib/db/collections", () => ({
  createCollection: createCollectionQuery,
  updateCollection: updateCollectionQuery,
  deleteCollection: deleteCollectionQuery,
}));

import {
  createCollection,
  updateCollection,
  deleteCollection,
} from "@/actions/collections";

// The query's resolved value is passed straight back as `data`.
const okCollection = { id: "col_1", name: "React Patterns" };

beforeEach(() => {
  vi.clearAllMocks();
  createCollectionQuery.mockResolvedValue(okCollection);
  updateCollectionQuery.mockResolvedValue(okCollection);
  deleteCollectionQuery.mockResolvedValue(true);
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

describe("updateCollection action — validation", () => {
  it("rejects an empty / whitespace-only name without touching the DB", async () => {
    const result = await updateCollection("col_1", input({ name: "   " }));

    expect(result.success).toBe(false);
    expect(result.error).toBe("Name is required");
    expect(updateCollectionQuery).not.toHaveBeenCalled();
  });

  it("trims the name and collapses an empty description to null", async () => {
    await updateCollection(
      "col_1",
      input({ name: "  React Patterns  ", description: "" }),
    );

    expect(updateCollectionQuery).toHaveBeenCalledWith("col_1", {
      name: "React Patterns",
      description: null,
    });
  });

  it("passes a provided description through", async () => {
    await updateCollection("col_1", input({ description: "Reusable hooks" }));

    expect(updateCollectionQuery).toHaveBeenCalledWith(
      "col_1",
      expect.objectContaining({ description: "Reusable hooks" }),
    );
  });
});

describe("updateCollection action — result", () => {
  it("returns the updated collection on success", async () => {
    const result = await updateCollection("col_1", input());

    expect(result).toEqual({ success: true, data: okCollection });
  });

  it("returns not-found when the query resolves null", async () => {
    updateCollectionQuery.mockResolvedValueOnce(null);

    const result = await updateCollection("col_x", input());

    expect(result.success).toBe(false);
    expect(result.error).toBe("Collection not found.");
  });

  it("returns a generic error when the query throws", async () => {
    updateCollectionQuery.mockRejectedValueOnce(new Error("db down"));

    const result = await updateCollection("col_1", input());

    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
  });
});

describe("deleteCollection action", () => {
  it("rejects an empty / whitespace-only id without touching the DB", async () => {
    const result = await deleteCollection("   ");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Collection id is required");
    expect(deleteCollectionQuery).not.toHaveBeenCalled();
  });

  it("trims the id before delegating and succeeds", async () => {
    const result = await deleteCollection("  col_1  ");

    expect(deleteCollectionQuery).toHaveBeenCalledWith("col_1");
    expect(result).toEqual({ success: true });
  });

  it("returns not-found when the query resolves false", async () => {
    deleteCollectionQuery.mockResolvedValueOnce(false);

    const result = await deleteCollection("col_x");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Collection not found.");
  });

  it("returns a generic error when the query throws", async () => {
    deleteCollectionQuery.mockRejectedValueOnce(new Error("db down"));

    const result = await deleteCollection("col_1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
  });
});
