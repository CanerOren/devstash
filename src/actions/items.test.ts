import { describe, it, expect, vi, beforeEach } from "vitest";

// The action delegates persistence to lib/db/items' updateItem (which pulls in
// prisma + auth). Mock it so these tests exercise only the action's Zod
// validation / normalization, with no DB or session.
const { updateItemQuery, deleteItemQuery } = vi.hoisted(() => ({
  updateItemQuery: vi.fn(),
  deleteItemQuery: vi.fn(),
}));

vi.mock("@/lib/db/items", () => ({
  updateItem: updateItemQuery,
  deleteItem: deleteItemQuery,
}));

import { updateItem, deleteItem } from "@/actions/items";

function input(overrides: Record<string, unknown> = {}) {
  return {
    title: "Hello",
    description: "",
    content: "",
    url: "",
    language: "",
    tags: [] as string[],
    ...overrides,
  };
}

// The query's resolved value is passed straight back as `data`.
const okDetail = { id: "item_1", title: "Hello" };

beforeEach(() => {
  vi.clearAllMocks();
  updateItemQuery.mockResolvedValue(okDetail);
  deleteItemQuery.mockResolvedValue(true);
});

describe("updateItem action — validation", () => {
  it("rejects an empty / whitespace-only title without touching the DB", async () => {
    const result = await updateItem("item_1", input({ title: "   " }));
    expect(result.success).toBe(false);
    expect(result.error).toBe("Title is required");
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("rejects an invalid URL", async () => {
    const result = await updateItem("item_1", input({ url: "not-a-url" }));
    expect(result.success).toBe(false);
    expect(result.error).toBe("Enter a valid URL");
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("trims the title and collapses empty optional fields to null", async () => {
    await updateItem("item_1", input({ title: "  Padded  " }));
    expect(updateItemQuery).toHaveBeenCalledWith("item_1", {
      title: "Padded",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
  });

  it("passes a valid URL through and keeps content verbatim", async () => {
    await updateItem("item_1", {
      title: "Link",
      description: "desc",
      content: "  spaced code  ",
      url: "https://example.com/x",
      language: "bash",
      tags: ["a"],
    });
    expect(updateItemQuery).toHaveBeenCalledWith("item_1", {
      title: "Link",
      description: "desc",
      content: "  spaced code  ", // not trimmed — code whitespace is significant
      url: "https://example.com/x",
      language: "bash",
      tags: ["a"],
    });
  });

  it("trims, drops blank, and de-duplicates tags", async () => {
    await updateItem("item_1", input({ tags: [" react ", "react", "", "hooks"] }));
    expect(updateItemQuery).toHaveBeenCalledWith(
      "item_1",
      expect.objectContaining({ tags: ["react", "hooks"] }),
    );
  });
});

describe("updateItem action — result", () => {
  it("returns the query's detail on success", async () => {
    const result = await updateItem("item_1", input());
    expect(result).toEqual({ success: true, data: okDetail });
  });

  it("returns a not-found error when the query resolves null (not the user's item)", async () => {
    updateItemQuery.mockResolvedValue(null);
    const result = await updateItem("missing", input());
    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns a generic error when the query throws", async () => {
    updateItemQuery.mockRejectedValue(new Error("db down"));
    const result = await updateItem("item_1", input());
    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
  });
});

describe("deleteItem action", () => {
  it("rejects an empty / whitespace-only id without touching the DB", async () => {
    const result = await deleteItem("   ");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Item id is required");
    expect(deleteItemQuery).not.toHaveBeenCalled();
  });

  it("deletes with the trimmed id and returns success", async () => {
    const result = await deleteItem("  item_1  ");
    expect(deleteItemQuery).toHaveBeenCalledWith("item_1");
    expect(result).toEqual({ success: true });
  });

  it("returns a not-found error when the query resolves false (not the user's item)", async () => {
    deleteItemQuery.mockResolvedValue(false);
    const result = await deleteItem("missing");
    expect(result).toEqual({ success: false, error: "Item not found." });
  });

  it("returns a generic error when the query throws", async () => {
    deleteItemQuery.mockRejectedValue(new Error("db down"));
    const result = await deleteItem("item_1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
  });
});
