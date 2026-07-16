import { Star } from "lucide-react";

import { getFavoriteItems } from "@/lib/db/items";
import { getFavoriteCollections } from "@/lib/db/collections";
import { FavoriteItemsSection } from "@/components/favorites/FavoriteItemsSection";
import { FavoriteCollectionsSection } from "@/components/favorites/FavoriteCollectionsSection";

// Reads live per-user data, so render on each request rather than prerendering.
export const dynamic = "force-dynamic";

// The /favorites page: all of the current user's favorited items and
// collections in a compact, dense list (VS Code / terminal style, not cards).
export default async function FavoritesPage() {
  const [items, collections] = await Promise.all([
    getFavoriteItems(),
    getFavoriteCollections(),
  ]);

  const isEmpty = items.length === 0 && collections.length === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
          <Star className="size-5 fill-amber-400 text-amber-400" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
          <p className="text-sm text-muted-foreground">
            Your favorited items and collections
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No favorites yet. Star an item or collection to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {items.length > 0 && <FavoriteItemsSection items={items} />}

          {collections.length > 0 && (
            <FavoriteCollectionsSection collections={collections} />
          )}
        </div>
      )}
    </div>
  );
}
