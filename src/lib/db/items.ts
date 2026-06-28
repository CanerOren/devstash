import { prisma } from "@/lib/prisma";
import { requireUserId, toLabel } from "@/lib/db/helpers";

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

// A system item type row for the sidebar nav, with the user's count for it.
export interface SidebarItemType {
  id: string;
  name: string; // raw type name, e.g. "snippet"
  label: string; // plural display label, e.g. "Snippets"
  icon: string; // Lucide icon name, e.g. "Code"
  color: string; // hex, e.g. "#3b82f6"
  count: number; // items of this type owned by the user
  href: string; // e.g. "/items/snippets"
}

// Canonical sidebar order for the system item types (matches the project
// overview's type table). ItemType has no timestamp, so we sort explicitly.
const TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

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

// The current user's pinned items (most recent first). Empty when none are
// pinned, in which case the dashboard omits the Pinned section entirely.
export async function getPinnedItems(): Promise<DashboardItem[]> {
  const userId = await requireUserId();
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: itemInclude,
  });

  return items.map(toDashboardItem);
}

// The current user's most recently created items for the Recent list.
export async function getRecentItems(limit = 10): Promise<DashboardItem[]> {
  const userId = await requireUserId();
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: itemInclude,
  });

  return items.map(toDashboardItem);
}

// Items of a single type, resolved from its plural URL slug, for the
// /items/[type] list page.
export interface ItemsByType {
  type: DashboardItemType;
  items: DashboardItem[];
}

// The current user's items of one system type, resolved from the plural URL
// slug used in the sidebar links (e.g. "snippets" → the "snippet" type), most
// recent first. Returns null when the slug doesn't match a system item type,
// so the page can render a 404.
export async function getItemsByType(
  typeSlug: string,
): Promise<ItemsByType | null> {
  const userId = await requireUserId();

  // Match against the same pluralization the sidebar uses (`${name}s`) so the
  // slug round-trips exactly, rather than guessing the singular form.
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    select: { id: true, name: true, icon: true, color: true },
  });
  const itemType = types.find((type) => `${type.name}s` === typeSlug);
  if (!itemType) return null;

  const items = await prisma.item.findMany({
    where: { userId, itemTypeId: itemType.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: itemInclude,
  });

  return {
    type: {
      id: itemType.id,
      name: itemType.name,
      label: toLabel(itemType.name),
      icon: itemType.icon,
      color: itemType.color,
    },
    items: items.map(toDashboardItem),
  };
}

// Aggregate item counts for the dashboard stat cards.
export async function getItemStats(): Promise<ItemStats> {
  const userId = await requireUserId();
  const where = { userId };
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.count({ where: { ...where, isFavorite: true } }),
  ]);

  return { total, favorites };
}

// The system item types for the sidebar, in canonical order, each with the
// current user's item count for that type (0 when the user has none).
export async function getSidebarItemTypes(): Promise<SidebarItemType[]> {
  const userId = await requireUserId();
  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({
      where: { isSystem: true },
      select: { id: true, name: true, icon: true, color: true },
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId },
      _count: true,
    }),
  ]);

  const countByTypeId = new Map(counts.map((c) => [c.itemTypeId, c._count]));

  return types
    .map((type) => ({
      id: type.id,
      name: type.name,
      label: `${toLabel(type.name)}s`,
      icon: type.icon,
      color: type.color,
      count: countByTypeId.get(type.id) ?? 0,
      href: `/items/${type.name}s`,
    }))
    .sort((a, b) => TYPE_ORDER.indexOf(a.name) - TYPE_ORDER.indexOf(b.name));
}
