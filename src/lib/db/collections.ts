import { prisma } from "@/lib/prisma";

// No auth yet — the dashboard reads the seeded demo user's data. Once NextAuth
// is wired up this constant gets replaced by the session user's id.
const DEMO_USER_EMAIL = "demo@devstash.io";

// A distinct item type present in a collection, used for the card footer icons.
export interface CollectionCardType {
  id: string;
  name: string; // raw type name, e.g. "snippet"
  label: string; // display label, e.g. "Snippet"
  icon: string; // Lucide icon name, e.g. "Code"
  color: string; // hex, e.g. "#3b82f6"
}

// View model for a single collection card on the dashboard.
export interface DashboardCollection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  types: CollectionCardType[]; // distinct types, most-common first
  primaryColor: string; // color of the most-common type (border tint)
}

export interface CollectionStats {
  total: number;
  favorites: number;
}

// A collection row for the sidebar nav. `primaryColor` is the most-used item
// type's color, shown as a circle next to non-favorite (recent) collections.
export interface SidebarCollection {
  id: string;
  name: string;
  isFavorite: boolean;
  itemCount: number;
  primaryColor: string;
}

// Capitalize a raw type name for display, e.g. "snippet" → "Snippet".
function toLabel(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Fetches the demo user's most recent collections for the dashboard grid. Each
// collection is returned with its item count, the distinct item types it
// contains (ordered by frequency so the most-common type is first), and the
// most-common type's color for the card's border tint.
export async function getDashboardCollections(
  limit = 6,
): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { user: { email: DEMO_USER_EMAIL } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: {
        select: {
          item: {
            select: {
              itemType: {
                select: { id: true, name: true, icon: true, color: true },
              },
            },
          },
        },
      },
    },
  });

  return collections.map((collection) => {
    // Tally how often each item type appears in the collection.
    const typeById = new Map<string, CollectionCardType>();
    const frequency = new Map<string, number>();

    for (const { item } of collection.items) {
      const type = item.itemType;
      if (!typeById.has(type.id)) {
        typeById.set(type.id, {
          id: type.id,
          name: type.name,
          label: toLabel(type.name),
          icon: type.icon,
          color: type.color,
        });
      }
      frequency.set(type.id, (frequency.get(type.id) ?? 0) + 1);
    }

    // Distinct types, most-common first (so types[0] is the primary type).
    const types = [...typeById.values()].sort(
      (a, b) => (frequency.get(b.id) ?? 0) - (frequency.get(a.id) ?? 0),
    );

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: collection.items.length,
      types,
      primaryColor: types[0]?.color ?? "var(--border)",
    };
  });
}

// All of the demo user's collections for the sidebar (most recent first), each
// with its item count and the color of its most-common item type.
export async function getSidebarCollections(): Promise<SidebarCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { user: { email: DEMO_USER_EMAIL } },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: {
          item: { select: { itemType: { select: { id: true, color: true } } } },
        },
      },
    },
  });

  return collections.map((collection) => {
    // Find the most-common item type's color for the recents circle.
    const frequency = new Map<string, number>();
    const colorById = new Map<string, string>();

    for (const { item } of collection.items) {
      const { id, color } = item.itemType;
      colorById.set(id, color);
      frequency.set(id, (frequency.get(id) ?? 0) + 1);
    }

    let primaryId: string | null = null;
    let max = 0;
    for (const [id, freq] of frequency) {
      if (freq > max) {
        max = freq;
        primaryId = id;
      }
    }

    return {
      id: collection.id,
      name: collection.name,
      isFavorite: collection.isFavorite,
      itemCount: collection.items.length,
      primaryColor: primaryId
        ? (colorById.get(primaryId) as string)
        : "var(--muted-foreground)",
    };
  });
}

// Aggregate collection counts for the dashboard stat cards.
export async function getCollectionStats(): Promise<CollectionStats> {
  const where = { user: { email: DEMO_USER_EMAIL } };
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where }),
    prisma.collection.count({ where: { ...where, isFavorite: true } }),
  ]);

  return { total, favorites };
}
