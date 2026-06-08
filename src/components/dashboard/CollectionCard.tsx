import Link from "next/link";
import { MoreHorizontal, Star } from "lucide-react";

import type { Collection, ItemType } from "@/lib/mock-data";
import { getTypeIcon } from "@/components/dashboard/type-icons";

// A collection card for the dashboard grid. The top border is tinted with the
// collection's primary (most-common) item-type color; the footer shows an icon
// for each item type present in the collection.
export function CollectionCard({
  collection,
  types,
  primaryColor,
}: {
  collection: Collection;
  types: ItemType[];
  primaryColor: string;
}) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group relative flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
      // Primary type color is data-driven, so the accent must be inline.
      style={{ borderTopColor: primaryColor, borderTopWidth: 2 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold">{collection.name}</h3>
          {collection.isFavorite && (
            <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
          )}
        </div>
        <MoreHorizontal className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <p className="mt-0.5 text-xs text-muted-foreground">
        {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
      </p>

      {collection.description && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {collection.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-1.5">
        {types.map((type) => {
          const Icon = getTypeIcon(type.icon);
          return (
            <Icon
              key={type.id}
              className="size-4"
              style={{ color: type.color }}
              aria-label={type.label}
            />
          );
        })}
      </div>
    </Link>
  );
}
