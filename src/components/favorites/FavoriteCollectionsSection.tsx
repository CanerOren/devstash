"use client";

import { useMemo } from "react";

import type { FavoriteCollection } from "@/lib/db/collections";
import {
  COLLECTION_SORT_FIELDS,
  sortFavoriteCollections,
  type CollectionSortField,
  type SortPreference,
} from "@/lib/favorites-sort";
import { FavoriteCollectionRow } from "@/components/favorites/FavoriteCollectionRow";
import { FavoritesSortControl } from "@/components/favorites/FavoritesSortControl";
import { usePersistentSort } from "@/components/favorites/use-persistent-sort";

const ALLOWED_FIELDS: readonly CollectionSortField[] = ["name", "date"];
const FALLBACK: SortPreference<CollectionSortField> = {
  field: "date",
  direction: "desc",
};

// The favorited-collections section with its own client-side sort control (name
// or date + direction), persisted to localStorage. Type sorting doesn't apply to
// collections, so it isn't offered here. Assumes a non-empty list.
export function FavoriteCollectionsSection({
  collections,
}: {
  collections: FavoriteCollection[];
}) {
  const [pref, setPref] = usePersistentSort(
    "favorites:collections:sort",
    ALLOWED_FIELDS,
    FALLBACK,
  );

  const sorted = useMemo(
    () => sortFavoriteCollections(collections, pref.field, pref.direction),
    [collections, pref.field, pref.direction],
  );

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3 px-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Collections · {collections.length}
        </h2>
        <FavoritesSortControl
          fields={COLLECTION_SORT_FIELDS}
          field={pref.field}
          direction={pref.direction}
          onFieldChange={(field) => setPref({ field, direction: pref.direction })}
          onDirectionToggle={() =>
            setPref({
              field: pref.field,
              direction: pref.direction === "asc" ? "desc" : "asc",
            })
          }
        />
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {sorted.map((collection) => (
          <FavoriteCollectionRow key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}
