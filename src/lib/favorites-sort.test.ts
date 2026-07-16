import { describe, it, expect } from "vitest";

import type { FavoriteItem } from "@/lib/db/items";
import type { FavoriteCollection } from "@/lib/db/collections";
import { sortFavoriteItems, sortFavoriteCollections } from "@/lib/favorites-sort";

// Minimal fixtures: only the fields the sort reads matter; the rest is padded
// and cast to the view-model type to keep the tests focused.
function item(
  partial: { title: string; typeName: string; updatedAt: string } & {
    id?: string;
  },
): FavoriteItem {
  return {
    id: partial.id ?? partial.title,
    title: partial.title,
    updatedAt: new Date(partial.updatedAt),
    type: { name: partial.typeName },
  } as unknown as FavoriteItem;
}

function collection(partial: {
  name: string;
  updatedAt: string;
  id?: string;
}): FavoriteCollection {
  return {
    id: partial.id ?? partial.name,
    name: partial.name,
    updatedAt: new Date(partial.updatedAt),
  } as unknown as FavoriteCollection;
}

describe("sortFavoriteItems", () => {
  const items = [
    item({ title: "banana", typeName: "note", updatedAt: "2026-01-02" }),
    item({ title: "Apple", typeName: "link", updatedAt: "2026-01-03" }),
    item({ title: "cherry", typeName: "snippet", updatedAt: "2026-01-01" }),
  ];

  it("does not mutate the input array", () => {
    const input = [...items];
    const snapshot = input.map((i) => i.id);
    sortFavoriteItems(input, "name", "asc");
    expect(input.map((i) => i.id)).toEqual(snapshot);
  });

  it("sorts by name ascending, case-insensitively", () => {
    const result = sortFavoriteItems(items, "name", "asc");
    expect(result.map((i) => i.title)).toEqual(["Apple", "banana", "cherry"]);
  });

  it("sorts by name descending", () => {
    const result = sortFavoriteItems(items, "name", "desc");
    expect(result.map((i) => i.title)).toEqual(["cherry", "banana", "Apple"]);
  });

  it("sorts by date ascending (oldest first)", () => {
    const result = sortFavoriteItems(items, "date", "asc");
    expect(result.map((i) => i.title)).toEqual(["cherry", "banana", "Apple"]);
  });

  it("sorts by date descending (newest first)", () => {
    const result = sortFavoriteItems(items, "date", "desc");
    expect(result.map((i) => i.title)).toEqual(["Apple", "banana", "cherry"]);
  });

  it("sorts by type using the canonical TYPE_ORDER (snippet < note < link)", () => {
    const result = sortFavoriteItems(items, "type", "asc");
    expect(result.map((i) => i.type.name)).toEqual(["snippet", "note", "link"]);
  });

  it("breaks type ties by name", () => {
    const tied = [
      item({ title: "zed", typeName: "snippet", updatedAt: "2026-01-01" }),
      item({ title: "aaa", typeName: "snippet", updatedAt: "2026-01-01" }),
    ];
    const result = sortFavoriteItems(tied, "type", "asc");
    expect(result.map((i) => i.title)).toEqual(["aaa", "zed"]);
  });

  it("sorts unknown types last", () => {
    const withUnknown = [
      item({ title: "mystery", typeName: "widget", updatedAt: "2026-01-01" }),
      item({ title: "known", typeName: "snippet", updatedAt: "2026-01-01" }),
    ];
    const result = sortFavoriteItems(withUnknown, "type", "asc");
    expect(result.map((i) => i.type.name)).toEqual(["snippet", "widget"]);
  });
});

describe("sortFavoriteCollections", () => {
  const collections = [
    collection({ name: "Zebra", updatedAt: "2026-01-02" }),
    collection({ name: "alpha", updatedAt: "2026-01-03" }),
    collection({ name: "Mango", updatedAt: "2026-01-01" }),
  ];

  it("does not mutate the input array", () => {
    const input = [...collections];
    const snapshot = input.map((c) => c.id);
    sortFavoriteCollections(input, "name", "asc");
    expect(input.map((c) => c.id)).toEqual(snapshot);
  });

  it("sorts by name ascending, case-insensitively", () => {
    const result = sortFavoriteCollections(collections, "name", "asc");
    expect(result.map((c) => c.name)).toEqual(["alpha", "Mango", "Zebra"]);
  });

  it("sorts by name descending", () => {
    const result = sortFavoriteCollections(collections, "name", "desc");
    expect(result.map((c) => c.name)).toEqual(["Zebra", "Mango", "alpha"]);
  });

  it("sorts by date ascending (oldest first)", () => {
    const result = sortFavoriteCollections(collections, "date", "asc");
    expect(result.map((c) => c.name)).toEqual(["Mango", "Zebra", "alpha"]);
  });

  it("sorts by date descending (newest first)", () => {
    const result = sortFavoriteCollections(collections, "date", "desc");
    expect(result.map((c) => c.name)).toEqual(["alpha", "Zebra", "Mango"]);
  });
});
