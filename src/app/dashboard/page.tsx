import Link from "next/link";
import { FolderHeart, FolderOpen, LayoutGrid, Star } from "lucide-react";

import { collections, items, itemTypes } from "@/lib/mock-data";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { StatCard } from "@/components/dashboard/StatCard";

// Lookup map: item-type id → ItemType, for resolving items/collections to types.
const typeById = new Map(itemTypes.map((type) => [type.id, type]));

// Dashboard home — main content area (Phase 3).
export default function DashboardPage() {
  const stats = [
    { label: "Items", value: items.length, icon: LayoutGrid, color: "#3b82f6" },
    {
      label: "Collections",
      value: collections.length,
      icon: FolderOpen,
      color: "#10b981",
    },
    {
      label: "Favorite Items",
      value: items.filter((i) => i.isFavorite).length,
      icon: Star,
      color: "#f59e0b",
    },
    {
      label: "Favorite Collections",
      value: collections.filter((c) => c.isFavorite).length,
      icon: FolderHeart,
      color: "#ec4899",
    },
  ];

  const pinnedItems = items.filter((i) => i.isPinned);
  const recentItems = [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

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
          {collections.map((collection) => {
            const types = collection.itemTypeIds
              .map((id) => typeById.get(id))
              .filter((type): type is NonNullable<typeof type> => Boolean(type));
            const primaryColor = types[0]?.color ?? "var(--border)";
            return (
              <CollectionCard
                key={collection.id}
                collection={collection}
                types={types}
                primaryColor={primaryColor}
              />
            );
          })}
        </div>
      </section>

      {/* Pinned items */}
      {pinnedItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pinned</h2>
          <div className="space-y-3">
            {pinnedItems.map((item) => {
              const itemType = typeById.get(item.itemTypeId);
              if (!itemType) return null;
              return (
                <ItemCard key={item.id} item={item} itemType={itemType} />
              );
            })}
          </div>
        </section>
      )}

      {/* Recent items */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent</h2>
        <div className="space-y-3">
          {recentItems.map((item) => {
            const itemType = typeById.get(item.itemTypeId);
            if (!itemType) return null;
            return <ItemCard key={item.id} item={item} itemType={itemType} />;
          })}
        </div>
      </section>
    </div>
  );
}
