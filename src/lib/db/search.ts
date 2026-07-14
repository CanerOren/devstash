import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/db/helpers";
import {
  itemInclude,
  toDashboardItem,
  type DashboardItem,
} from "@/lib/db/items";

// A searchable item for the command palette: the dashboard item view model (so a
// result can open the existing item drawer directly) plus a short content
// preview used only as a fuzzy-search keyword. The preview is truncated so the
// pre-fetched, client-shipped dataset stays small.
export interface SearchItem extends DashboardItem {
  contentPreview: string;
}

// A searchable collection for the command palette.
export interface SearchCollection {
  id: string;
  name: string;
  itemCount: number;
}

export interface SearchData {
  items: SearchItem[];
  collections: SearchCollection[];
}

// Chars of item content kept for fuzzy matching (enough to catch keywords in the
// body without shipping full contents to the client).
const CONTENT_PREVIEW_LENGTH = 200;

// Upper bounds on the pre-fetched dataset, so the client-side palette stays
// bounded even for large accounts. Well above the free-tier item cap (50).
const SEARCH_ITEM_LIMIT = 500;
const SEARCH_COLLECTION_LIMIT = 200;

// The current user's items + collections for the client-side command palette,
// fetched once on app load. Reuses the shared item include/mapper so results
// carry the same type/tag data as the cards.
export async function getSearchData(): Promise<SearchData> {
  const userId = await requireUserId();

  const [items, collections] = await Promise.all([
    prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: SEARCH_ITEM_LIMIT,
      include: itemInclude,
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      take: SEARCH_COLLECTION_LIMIT,
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    items: items.map((item) => ({
      ...toDashboardItem(item),
      contentPreview: (item.content ?? "").slice(0, CONTENT_PREVIEW_LENGTH),
    })),
    collections: collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      itemCount: collection._count.items,
    })),
  };
}
