import Link from "next/link";
import { FolderHeart, FolderOpen, LayoutGrid, Star } from "lucide-react";

import {
  getCollectionStats,
  getDashboardCollections,
} from "@/lib/db/collections";
import {
  getItemStats,
  getPinnedItems,
  getRecentItems,
} from "@/lib/db/items";
import {
  DASHBOARD_COLLECTIONS_LIMIT,
  DASHBOARD_RECENT_ITEMS_LIMIT,
} from "@/lib/pagination";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { StatCard } from "@/components/dashboard/StatCard";

// Reads live per-user data from the database, so render on each request rather
// than prerendering at build time. (Becomes implicit once auth reads cookies.)
export const dynamic = "force-dynamic";

// Dashboard home — main content area (Phase 3).
export default async function DashboardPage() {
  // Collections and items both come from the database.
  const [
    collections,
    collectionStats,
    itemStats,
    pinnedItems,
    recentItems,
  ] = await Promise.all([
    getDashboardCollections(DASHBOARD_COLLECTIONS_LIMIT),
    getCollectionStats(),
    getItemStats(),
    getPinnedItems(),
    getRecentItems(DASHBOARD_RECENT_ITEMS_LIMIT),
  ]);

  const stats = [
    {
      label: "Items",
      value: itemStats.total,
      icon: LayoutGrid,
      color: "#3b82f6",
    },
    {
      label: "Collections",
      value: collectionStats.total,
      icon: FolderOpen,
      color: "#10b981",
    },
    {
      label: "Favorite Items",
      value: itemStats.favorites,
      icon: Star,
      color: "#f59e0b",
    },
    {
      label: "Favorite Collections",
      value: collectionStats.favorites,
      icon: FolderHeart,
      color: "#ec4899",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your developer knowledge hub
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Collections */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Collections</h2>
          <Link
            href="/collections"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      {/* Pinned items */}
      {pinnedItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pinned</h2>
          <div className="space-y-3">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recent items */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent</h2>
        <div className="space-y-3">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
