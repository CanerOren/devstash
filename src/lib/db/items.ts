import { prisma } from "@/lib/prisma";

// No auth yet — the dashboard reads the seeded demo user's data. Once NextAuth
// is wired up this constant gets replaced by the session user's id.
const DEMO_USER_EMAIL = "demo@devstash.io";

// The item type an item belongs to, used for the card's icon/border.
export interface DashboardItemType {
  id: string;
  name: string; // raw type name, e.g. "snippet"
  label: string; // display label, e.g. "Snippet"
  icon: string; // Lucide icon name, e.g. "Code"
  color: string; // hex, e.g. "#3b82f6"
}

// View model for a single item row (Pinned / Recent lists) on the dashboard.
export interface DashboardItem {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  tags: string[];
  type: DashboardItemType;
}

export interface ItemStats {
  total: number;
  favorites: number;
}

// Capitalize a raw type name for display, e.g. "snippet" → "Snippet".
function toLabel(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Shared include shape so pinned/recent rows carry their type and tag names.
const itemInclude = {
  itemType: {
    select: { id: true, name: true, icon: true, color: true },
  },
  tags: {
    select: { tag: { select: { name: true } } },
  },
} as const;

type ItemRow = {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  itemType: { id: string; name: string; icon: string; color: string };
  tags: { tag: { name: string } }[];
};

function toDashboardItem(item: ItemRow): DashboardItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    tags: item.tags.map(({ tag }) => tag.name),
    type: {
      id: item.itemType.id,
      name: item.itemType.name,
      label: toLabel(item.itemType.name),
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
  };
}

// The demo user's pinned items (most recent first). Empty when none are pinned,
// in which case the dashboard omits the Pinned section entirely.
export async function getPinnedItems(): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { user: { email: DEMO_USER_EMAIL }, isPinned: true },
    orderBy: { createdAt: "desc" },
    include: itemInclude,
  });

  return items.map(toDashboardItem);
}

// The demo user's most recently created items for the Recent list.
export async function getRecentItems(limit = 10): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { user: { email: DEMO_USER_EMAIL } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: itemInclude,
  });

  return items.map(toDashboardItem);
}

// Aggregate item counts for the dashboard stat cards.
export async function getItemStats(): Promise<ItemStats> {
  const where = { user: { email: DEMO_USER_EMAIL } };
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.count({ where: { ...where, isFavorite: true } }),
  ]);

  return { total, favorites };
}
