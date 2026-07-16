// Pure client-side sorting for the favorites page. Kept free of any server-only
// imports (only type-only imports of the view models) so it can be unit-tested
// and bundled into the client sort controls.

import type { FavoriteItem } from "@/lib/db/items";
import type { FavoriteCollection } from "@/lib/db/collections";

export type SortDirection = "asc" | "desc";
export type ItemSortField = "name" | "date" | "type";
export type CollectionSortField = "name" | "date";

export interface SortPreference<F extends string> {
  field: F;
  direction: SortDirection;
}

// Field options shown in each section's sort dropdown (order = display order).
export const ITEM_SORT_FIELDS: readonly { value: ItemSortField; label: string }[] =
  [
    { value: "date", label: "Date favorited" },
    { value: "name", label: "Name" },
    { value: "type", label: "Type" },
  ];

export const COLLECTION_SORT_FIELDS: readonly {
  value: CollectionSortField;
  label: string;
}[] = [
  { value: "date", label: "Date favorited" },
  { value: "name", label: "Name" },
];

// Canonical item-type ordering (mirrors the sidebar TYPE_ORDER). Unknown types
// sort last so the comparison stays stable.
const TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

function typeRank(name: string): number {
  const index = TYPE_ORDER.indexOf(name);
  return index === -1 ? TYPE_ORDER.length : index;
}

// Case-insensitive, locale-aware name comparison.
function compareName(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

// Sorts favorited items by the given field, then flips for descending order.
// Returns a new array — never mutates the input.
export function sortFavoriteItems(
  items: FavoriteItem[],
  field: ItemSortField,
  direction: SortDirection,
): FavoriteItem[] {
  const sorted = [...items].sort((a, b) => {
    switch (field) {
      case "name":
        return compareName(a.title, b.title);
      case "date":
        return a.updatedAt.getTime() - b.updatedAt.getTime();
      case "type": {
        const byType = typeRank(a.type.name) - typeRank(b.type.name);
        return byType !== 0 ? byType : compareName(a.title, b.title);
      }
    }
  });
  return direction === "desc" ? sorted.reverse() : sorted;
}

// Sorts favorited collections by the given field, then flips for descending.
// Returns a new array — never mutates the input.
export function sortFavoriteCollections(
  collections: FavoriteCollection[],
  field: CollectionSortField,
  direction: SortDirection,
): FavoriteCollection[] {
  const sorted = [...collections].sort((a, b) => {
    switch (field) {
      case "name":
        return compareName(a.name, b.name);
      case "date":
        return a.updatedAt.getTime() - b.updatedAt.getTime();
    }
  });
  return direction === "desc" ? sorted.reverse() : sorted;
}
