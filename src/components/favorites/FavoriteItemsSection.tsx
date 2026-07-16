"use client";

import { useMemo } from "react";

import type { FavoriteItem } from "@/lib/db/items";
import {
  ITEM_SORT_FIELDS,
  sortFavoriteItems,
  type ItemSortField,
  type SortPreference,
} from "@/lib/favorites-sort";
import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
import { FavoritesSortControl } from "@/components/favorites/FavoritesSortControl";
import { usePersistentSort } from "@/components/favorites/use-persistent-sort";

const ALLOWED_FIELDS: readonly ItemSortField[] = ["name", "date", "type"];
const FALLBACK: SortPreference<ItemSortField> = {
  field: "date",
  direction: "desc",
};

// The favorited-items section with its own client-side sort control (name, date,
// or type + direction), persisted to localStorage. Assumes a non-empty list.
export function FavoriteItemsSection({ items }: { items: FavoriteItem[] }) {
  const [pref, setPref] = usePersistentSort(
    "favorites:items:sort",
    ALLOWED_FIELDS,
    FALLBACK,
  );

  const sorted = useMemo(
    () => sortFavoriteItems(items, pref.field, pref.direction),
    [items, pref.field, pref.direction],
  );

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3 px-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Items · {items.length}
        </h2>
        <FavoritesSortControl
          fields={ITEM_SORT_FIELDS}
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
        {sorted.map((item) => (
          <FavoriteItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
