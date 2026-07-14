import { prisma } from "@/lib/prisma";
import { requireUserId, toLabel } from "@/lib/db/helpers";
import {
  itemInclude,
  toDashboardItem,
  type DashboardItem,
  type DashboardItemType,
} from "@/lib/db/items";
import {
  COLLECTIONS_PER_PAGE,
  DASHBOARD_COLLECTIONS_LIMIT,
  ITEMS_PER_PAGE,
  getPagination,
} from "@/lib/pagination";

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

// A minimal collection option for the item forms' collection multi-select.
export interface CollectionOption {
  id: string;
  name: string;
}

// The Prisma shape shared by the dashboard-card fetchers/mutators: a collection
// with just enough of each contained item to derive its distinct item types.
interface CollectionWithTypeItems {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  items: {
    item: {
      itemType: { id: string; name: string; icon: string; color: string };
    };
  }[];
}

// The `include` for the shape above — reused by every fetcher/mutator that
// returns a DashboardCollection so the tally logic stays consistent.
const dashboardCollectionInclude = {
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
} as const;

// Builds a DashboardCollection view model from a collection-with-type-items row:
// tallies the distinct item types (ordered most-common first) and picks the
// most-common type's color as the card's border tint.
function buildDashboardCollection(
  collection: CollectionWithTypeItems,
): DashboardCollection {
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
}

// Fetches the current user's most recent collections for the dashboard grid.
// Each collection is returned with its item count, the distinct item types it
// contains (ordered by frequency so the most-common type is first), and the
// most-common type's color for the card's border tint.
export async function getDashboardCollections(
  limit = DASHBOARD_COLLECTIONS_LIMIT,
): Promise<DashboardCollection[]> {
  const userId = await requireUserId();
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: dashboardCollectionInclude,
  });

  return collections.map(buildDashboardCollection);
}

// A page of the current user's collections for the /collections list page.
// `collections` holds only the current page; `page` / `totalPages` describe the
// full set for the pagination control.
export interface CollectionsPage {
  collections: DashboardCollection[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// Fetches one page of the current user's collections (most recent first), each
// as a DashboardCollection card view model. Only the requested page's rows are
// fetched (COLLECTIONS_PER_PAGE per page), rather than loading every collection.
export async function getCollectionsPage(
  requestedPage = 1,
): Promise<CollectionsPage> {
  const userId = await requireUserId();

  const totalCount = await prisma.collection.count({ where: { userId } });
  const { page, totalPages, skip, take } = getPagination(
    requestedPage,
    totalCount,
    COLLECTIONS_PER_PAGE,
  );

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: dashboardCollectionInclude,
  });

  return {
    collections: collections.map(buildDashboardCollection),
    totalCount,
    page,
    totalPages,
  };
}

// All of the current user's collections for the sidebar (most recent first),
// each with its item count and the color of its most-common item type.
export async function getSidebarCollections(): Promise<SidebarCollection[]> {
  const userId = await requireUserId();
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
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
        ? (colorById.get(primaryId) ?? "var(--muted-foreground)")
        : "var(--muted-foreground)",
    };
  });
}

// The fields accepted when creating a collection. Validated by the server
// action's Zod schema before reaching here, so values are already trimmed and
// "" collapsed to null.
export interface CreateCollectionData {
  name: string;
  description: string | null;
}

// Creates a collection for the current user and returns its DashboardCollection
// view model. A freshly created collection has no items, so `types` is empty and
// `primaryColor` falls back to the default border tint.
export async function createCollection(
  data: CreateCollectionData,
): Promise<DashboardCollection> {
  const userId = await requireUserId();

  const created = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
    },
  });

  return {
    id: created.id,
    name: created.name,
    description: created.description,
    isFavorite: created.isFavorite,
    itemCount: 0,
    types: [],
    primaryColor: "var(--border)",
  };
}

// The fields accepted when editing a collection's metadata. Validated by the
// server action's Zod schema before reaching here.
export interface UpdateCollectionData {
  name: string;
  description: string | null;
}

// Updates a collection's metadata (name/description) and returns its refreshed
// DashboardCollection view model. Scoped to the session user via an ownership
// check first (`update`'s where only takes the unique id), so another user's id
// (or an unknown id) resolves to null and the caller can 404.
export async function updateCollection(
  id: string,
  data: UpdateCollectionData,
): Promise<DashboardCollection | null> {
  const userId = await requireUserId();

  const existing = await prisma.collection.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const updated = await prisma.collection.update({
    where: { id },
    data: { name: data.name, description: data.description },
    include: dashboardCollectionInclude,
  });

  return buildDashboardCollection(updated);
}

// Deletes a collection. Scoped to the session user via an ownership check first.
// Its items are NOT deleted — only the `ItemCollection` join rows are removed
// (via the join table's onDelete: Cascade), so the items simply leave this
// collection. Returns false when the id isn't the user's (or doesn't exist).
export async function deleteCollection(id: string): Promise<boolean> {
  const userId = await requireUserId();

  const existing = await prisma.collection.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.collection.delete({ where: { id } });
  return true;
}

// All of the current user's collections as lightweight { id, name } options for
// the item forms' collection multi-select (alphabetical). Kept separate from the
// sidebar/dashboard fetchers, which carry heavy nested item/type data the
// selector doesn't need.
export async function getCollectionOptions(): Promise<CollectionOption[]> {
  const userId = await requireUserId();
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

// A distinct item type present in a collection, with how many items of that
// type it contains — used for the collection detail header chips.
export interface CollectionDetailType extends DashboardItemType {
  count: number;
}

// A single collection with its items, for the /collections/[id] detail page.
// Paginated: `items` holds only the current page, while `itemCount` and `types`
// describe the whole collection (so the header count and type chips stay stable
// across pages), and `page` / `totalPages` drive the pagination control.
export interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  types: CollectionDetailType[]; // distinct types present, most-common first
  items: DashboardItem[]; // current page, most recently added first
  page: number;
  totalPages: number;
}

// Full detail for one of the current user's collections, by id. Scoped to the
// session user via `findFirst({ where: { id, userId } })`, so another user's id
// (or an unknown id) resolves to null and the page can render a 404. Only the
// requested page of items is fetched (COLLECTIONS_PER_PAGE per page); the type
// chips reflect the whole collection via a separate groupBy aggregate, not just
// the current page. Items are hydrated through the shared item include/mapper.
export async function getCollectionDetail(
  id: string,
  requestedPage = 1,
): Promise<CollectionDetail | null> {
  const userId = await requireUserId();

  // Ownership + total count + whole-collection type distribution, in parallel.
  const [collection, totalCount, typeGroups] = await Promise.all([
    prisma.collection.findFirst({
      where: { id, userId },
      select: { id: true, name: true, description: true, isFavorite: true },
    }),
    prisma.itemCollection.count({ where: { collectionId: id } }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { collections: { some: { collectionId: id } } },
      _count: true,
    }),
  ]);
  if (!collection) return null;

  const { page, totalPages, skip, take } = getPagination(
    requestedPage,
    totalCount,
    ITEMS_PER_PAGE,
  );

  // Page of items + the type rows for the chips (only the types actually
  // present), in parallel.
  const typeIds = typeGroups.map((group) => group.itemTypeId);
  const [joinRows, typeRows] = await Promise.all([
    prisma.itemCollection.findMany({
      where: { collectionId: id },
      orderBy: { addedAt: "desc" },
      skip,
      take,
      include: { item: { include: itemInclude } },
    }),
    typeIds.length
      ? prisma.itemType.findMany({
          where: { id: { in: typeIds } },
          select: { id: true, name: true, icon: true, color: true },
        })
      : Promise.resolve([]),
  ]);

  const items = joinRows.map(({ item }) => toDashboardItem(item));

  // Distinct types across the whole collection, each with its total count,
  // ordered by frequency (most-common first).
  const countByTypeId = new Map(
    typeGroups.map((group) => [group.itemTypeId, group._count]),
  );
  const types: CollectionDetailType[] = typeRows
    .map((row) => ({
      id: row.id,
      name: row.name,
      label: toLabel(row.name),
      icon: row.icon,
      color: row.color,
      count: countByTypeId.get(row.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    itemCount: totalCount,
    types,
    items,
    page,
    totalPages,
  };
}

// Aggregate collection counts for the dashboard stat cards.
export async function getCollectionStats(): Promise<CollectionStats> {
  const userId = await requireUserId();
  const where = { userId };
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where }),
    prisma.collection.count({ where: { ...where, isFavorite: true } }),
  ]);

  return { total, favorites };
}
