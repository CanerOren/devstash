import Link from "next/link";
import { Folder } from "lucide-react";

import type { FavoriteCollection } from "@/lib/db/collections";
import { formatShortDate } from "@/lib/format";

// A dense, terminal-style row for a favorited collection: a folder icon tinted
// by its most-common item type, name, item-count badge, and the date it was
// favorited (updatedAt). Clicking navigates to the collection detail page.
export function FavoriteCollectionRow({
  collection,
}: {
  collection: FavoriteCollection;
}) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group flex w-full items-center gap-3 px-3 py-2 font-mono text-sm transition-colors hover:bg-accent/40"
    >
      <Folder
        className="size-4 shrink-0"
        style={{ color: collection.primaryColor }}
      />
      <span className="min-w-0 flex-1 truncate font-medium">
        {collection.name}
      </span>
      <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
      </span>
      <time className="shrink-0 text-xs text-muted-foreground">
        {formatShortDate(collection.updatedAt)}
      </time>
    </Link>
  );
}
