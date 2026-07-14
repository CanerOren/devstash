import { describe, it, expect, vi, beforeEach } from "vitest";

// The action delegates persistence to lib/db/items' updateItem (which pulls in
// prisma + auth). Mock it so these tests exercise only the action's Zod
// validation / normalization, with no DB or session.
const { createItemQuery, updateItemQuery, deleteItemQuery } = vi.hoisted(() => ({
  createItemQuery: vi.fn(),
  updateItemQuery: vi.fn(),
  deleteItemQuery: vi.fn(),
}));

vi.mock("@/lib/db/items", () => ({
  createItem: createItemQuery,
  updateItem: updateItemQuery,
  deleteItem: deleteItemQuery,
}));

import { createItem, updateItem, deleteItem } from "@/actions/items";

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
  createItemQuery.mockResolvedValue(okDetail);
  updateItemQuery.mockResolvedValue(okDetail);
  deleteItemQuery.mockResolvedValue(true);
});

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    type: "snippet",
    title: "Hello",
    description: "",
    content: "",
    url: "",
    language: "",
    fileUrl: "",
    fileName: "",
    fileSize: null,
    tags: [] as string[],
    ...overrides,
  };
}

describe("createItem action — validation", () => {
  it("rejects an empty / whitespace-only title without touching the DB", async () => {
    const result = await createItem(createInput({ title: "   " }));
    expect(result.success).toBe(false);
    expect(result.error).toBe("Title is required");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("rejects an unknown type", async () => {
    const result = await createItem(createInput({ type: "bogus" }));
    expect(result.success).toBe(false);
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("requires an uploaded file for file/image items", async () => {
    const result = await createItem(createInput({ type: "image", fileUrl: "" }));
    expect(result.success).toBe(false);
    expect(result.error).toBe("A file is required");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("requires a URL for link items", async () => {
    const result = await createItem(createInput({ type: "link", url: "" }));
    expect(result.success).toBe(false);
    expect(result.error).toBe("URL is required");
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("rejects an invalid URL for link items", async () => {
    const result = await createItem(
      createInput({ type: "link", url: "not-a-url" }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Enter a valid URL");
    expect(createItemQuery).not.toHaveBeenCalled();
  });
});

describe("createItem action — normalization", () => {
  it("trims the title, collapses empties to null, and keeps content for text types", async () => {
    await createItem(
      createInput({ title: "  Padded  ", content: "  code  ", tags: ["a"] }),
    );
    expect(createItemQuery).toHaveBeenCalledWith({
      typeName: "snippet",
      title: "Padded",
      description: null,
      content: "  code  ", // not trimmed — code whitespace is significant
      url: null, // snippet is not a link
      language: null,
      fileUrl: null, // snippet is not a file type
      fileName: null,
      fileSize: null,
      tags: ["a"],
      collectionIds: [],
    });
  });

  it("trims, drops blanks, and dedupes collectionIds", async () => {
    await createItem(
      createInput({ collectionIds: [" c_1 ", "c_2", "", "c_1"] }),
    );
    expect(createItemQuery).toHaveBeenCalledWith(
      expect.objectContaining({ collectionIds: ["c_1", "c_2"] }),
    );
  });

  it("keeps file metadata and nulls content/url/language for file/image items", async () => {
    await createItem(
      createInput({
        type: "image",
        content: "ignored",
        language: "ignored",
        url: "https://ignored.example.com",
        fileUrl: "https://cdn.example.com/user_1/abc-logo.png",
        fileName: "logo.png",
        fileSize: 2048,
      }),
    );
    expect(createItemQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        typeName: "image",
        content: null,
        language: null,
        url: null,
        fileUrl: "https://cdn.example.com/user_1/abc-logo.png",
        fileName: "logo.png",
        fileSize: 2048,
      }),
    );
  });

  it("keeps the url and nulls content/language for link items", async () => {
    await createItem(
      createInput({
        type: "link",
        content: "ignored",
        language: "ignored",
        url: "https://example.com/x",
      }),
    );
    expect(createItemQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        typeName: "link",
        content: null,
        language: null,
        url: "https://example.com/x",
      }),
    );
  });

  it("nulls language for a note (content kept, language not applicable)", async () => {
    await createItem(
      createInput({ type: "note", content: "a note", language: "markdown" }),
    );
    expect(createItemQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        typeName: "note",
        content: "a note",
        language: null,
      }),
    );
  });

  it("trims, drops blank, and de-duplicates tags", async () => {
    await createItem(createInput({ tags: [" react ", "react", "", "hooks"] }));
    expect(createItemQuery).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ["react", "hooks"] }),
    );
  });
});

describe("createItem action — result", () => {
  it("returns the query's detail on success", async () => {
    const result = await createItem(createInput());
    expect(result).toEqual({ success: true, data: okDetail });
  });

  it("returns an error when the query resolves null (missing system type)", async () => {
    createItemQuery.mockResolvedValue(null);
    const result = await createItem(createInput());
    expect(result).toEqual({ success: false, error: "Could not create item." });
  });

  it("returns a generic error when the query throws", async () => {
    createItemQuery.mockRejectedValue(new Error("db down"));
    const result = await createItem(createInput());
    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong. Please try again.");
  });
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
      collectionIds: [],
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
      collectionIds: [],
    });
  });

  it("trims, drops blank, and de-duplicates tags", async () => {
    await updateItem("item_1", input({ tags: [" react ", "react", "", "hooks"] }));
    expect(updateItemQuery).toHaveBeenCalledWith(
      "item_1",
      expect.objectContaining({ tags: ["react", "hooks"] }),
    );
  });

  it("trims, drops blanks, and dedupes collectionIds", async () => {
    await updateItem(
      "item_1",
      input({ collectionIds: [" c_1 ", "c_2", "", "c_1"] }),
    );
    expect(updateItemQuery).toHaveBeenCalledWith(
      "item_1",
      expect.objectContaining({ collectionIds: ["c_1", "c_2"] }),
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
