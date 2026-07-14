import Link from "next/link";
import { Star } from "lucide-react";

import type { DashboardCollection } from "@/lib/db/collections";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { CollectionCardMenu } from "@/components/dashboard/CollectionCardMenu";

// A collection card for the dashboard grid. The left border is tinted with the
// collection's primary (most-common) item-type color; the footer shows an icon
// for each item type present in the collection. Clicking anywhere on the card
// (except the ⋯ menu) navigates to the collection's page.
export function CollectionCard({
  collection,
}: {
  collection: DashboardCollection;
}) {
  const { types, primaryColor } = collection;
  return (
    <div
      className="group relative flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
      // Primary type color is data-driven, so the accent must be inline.
      style={{ borderLeftColor: primaryColor, borderLeftWidth: 2 }}
    >
      {/* Full-card navigation target. Sits behind the content so the ⋯ menu can
          be a sibling on top rather than nested inside the anchor. */}
      <Link
        href={`/collections/${collection.id}`}
        aria-label={`Open ${collection.name}`}
        className="absolute inset-0 rounded-lg"
      />

      <div className="pointer-events-none flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold">{collection.name}</h3>
          {collection.isFavorite && (
            <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
          )}
        </div>
        {/* Interactive — re-enable pointer events on the menu itself. */}
        <div className="pointer-events-auto">
          <CollectionCardMenu collection={collection} />
        </div>
      </div>

      <p className="pointer-events-none mt-0.5 text-xs text-muted-foreground">
        {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
      </p>

      {collection.description && (
        <p className="pointer-events-none mt-2 line-clamp-2 text-xs text-muted-foreground">
          {collection.description}
        </p>
      )}

      <div className="pointer-events-none mt-4 flex items-center gap-1.5">
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
    </div>
  );
}
