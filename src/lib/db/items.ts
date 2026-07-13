import { prisma } from "@/lib/prisma";
import { requireUserId, toLabel } from "@/lib/db/helpers";
import { deleteFromR2ByUrl } from "@/lib/r2";

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
  fileUrl: string | null; // R2 URL for FILE items (image thumbnails, etc.)
  fileName: string | null; // original upload filename, for FILE items
  fileSize: number | null; // bytes, for FILE items
  tags: string[];
  type: DashboardItemType;
}

export interface ItemStats {
  total: number;
  favorites: number;
}

// Full detail for a single item, loaded on demand when its drawer opens. Carries
// everything the card view-model lacks (content, language, collections, dates).
export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  type: DashboardItemType;
  collections: { id: string; name: string }[];
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
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  itemType: { id: string; name: string; icon: string; color: string };
  tags: { tag: { name: string } }[];
};

// Maps a raw item-type row to the DashboardItemType view model (adds the
// capitalized display label). Shared by every fetcher that resolves an item's
// type, so the projection lives in one place.
function toItemType(row: {
  id: string;
  name: string;
  icon: string;
  color: string;
}): DashboardItemType {
  return {
    id: row.id,
    name: row.name,
    label: toLabel(row.name),
    icon: row.icon,
    color: row.color,
  };
}

function toDashboardItem(item: ItemRow): DashboardItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    tags: item.tags.map(({ tag }) => tag.name),
    type: toItemType(item.itemType),
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
    type: toItemType(itemType),
    items: items.map(toDashboardItem),
  };
}

// Full detail for one of the current user's items, by id. Scoped to the session
// user via `findFirst({ where: { id, userId } })`, so another user's id resolves
// to null (the API route turns that into a 404). Powers the item drawer.
export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  const userId = await requireUserId();

  const item = await prisma.item.findFirst({
    where: { id, userId },
    include: {
      ...itemInclude,
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  });
  if (!item) return null;

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    contentType: item.contentType,
    content: item.content,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    language: item.language,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tags: item.tags.map(({ tag }) => tag.name),
    type: toItemType(item.itemType),
    collections: item.collections.map(({ collection }) => collection),
  };
}

// Just the fields the file-streaming routes (download/image) need to locate and
// serve a FILE item's object. Kept separate from `getItemDetail` so those hot
// paths (every gallery thumbnail hits the image route) skip the itemType/tags/
// collections joins.
export interface ItemFileRef {
  contentType: ItemDetail["contentType"];
  fileUrl: string | null;
  fileName: string | null;
}

// User-scoped lookup of a single item's file reference. Returns null when the
// item isn't the current user's (ownership check via `requireUserId`), so the
// streaming routes stay behind the same authorization as `getItemDetail`.
export async function getItemFileRef(id: string): Promise<ItemFileRef | null> {
  const userId = await requireUserId();

  return prisma.item.findFirst({
    where: { id, userId },
    select: { contentType: true, fileUrl: true, fileName: true },
  });
}

// The fields needed to create an item, as accepted by `createItem`. Validated by
// the server action's Zod schema before reaching here, so values are already
// normalized (trimmed title, empty strings collapsed to null, tags deduped, and
// type-inapplicable fields nulled out).
export interface CreateItemData {
  typeName: string; // raw system type name, e.g. "snippet"
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  // File/image types only — the R2 object metadata from the upload route.
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
}

// Creates an item of a system type for the current user and returns its full
// ItemDetail. Resolves the item type by its raw name and derives contentType
// from it: URL for links, FILE for file/image, TEXT otherwise. Returns null when
// the type name doesn't match a system item type (the caller turns that into an
// error). Tags connect-or-create by (name, userId) so they're reused across
// items, matching updateItem.
export async function createItem(
  data: CreateItemData,
): Promise<ItemDetail | null> {
  const userId = await requireUserId();

  const itemType = await prisma.itemType.findFirst({
    where: { name: data.typeName, isSystem: true },
    select: { id: true },
  });
  if (!itemType) return null;

  const contentType =
    data.typeName === "link"
      ? "URL"
      : data.typeName === "file" || data.typeName === "image"
        ? "FILE"
        : "TEXT";

  const created = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      contentType,
      userId,
      itemTypeId: itemType.id,
      tags: {
        create: data.tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name_userId: { name, userId } },
              create: { name, userId },
            },
          },
        })),
      },
    },
    select: { id: true },
  });

  return getItemDetail(created.id);
}

// The editable fields of an item, as accepted by `updateItem`. Validated by the
// server action's Zod schema before reaching here, so values are already
// normalized (trimmed title, empty strings collapsed to null, tags deduped).
export interface UpdateItemData {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
}

// Updates one of the current user's items and returns the refreshed ItemDetail
// (so the drawer can refresh without a second fetch). Scoped to the session user
// via a prior ownership check; returns null when the id isn't the user's (the
// caller turns that into a "not found" error). Tag handling per the spec:
// replace the item's join rows wholesale (deleteMany) and connect-or-create each
// tag by its (name, userId) unique key, so tags are reused across items.
export async function updateItem(
  id: string,
  data: UpdateItemData,
): Promise<ItemDetail | null> {
  const userId = await requireUserId();

  // Ownership check — `update`'s where only takes the unique id, so we verify
  // the item belongs to the session user first.
  const existing = await prisma.item.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.item.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        deleteMany: {},
        create: data.tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name_userId: { name, userId } },
              create: { name, userId },
            },
          },
        })),
      },
    },
  });

  return getItemDetail(id);
}

// Deletes one of the current user's items. Scoped to the session user via an
// ownership check; returns false when the id isn't the user's (the caller turns
// that into a "not found" error), true when the delete succeeds. ItemCollection
// and ItemTag join rows cascade on delete, so no manual cleanup is needed. For
// FILE items, the backing R2 object is removed best-effort after the row is
// deleted (a storage hiccup won't fail the delete or leave a dangling row).
export async function deleteItem(id: string): Promise<boolean> {
  const userId = await requireUserId();

  // Ownership check — `delete`'s where only takes the unique id, so we verify
  // the item belongs to the session user first. Grab fileUrl for R2 cleanup.
  const existing = await prisma.item.findFirst({
    where: { id, userId },
    select: { id: true, fileUrl: true },
  });
  if (!existing) return false;

  await prisma.item.delete({ where: { id } });

  if (existing.fileUrl) {
    await deleteFromR2ByUrl(existing.fileUrl);
  }

  return true;
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

// A creatable item type descriptor for the "New Item" modal's type selector.
export interface CreatableType {
  name: string; // raw type name, e.g. "snippet" — must match the server enum
  label: string; // singular display label, e.g. "Snippet"
  icon: string; // Lucide icon name, e.g. "Code"
  color: string; // hex, e.g. "#3b82f6"
}

// The types the "New Item" modal can create: all 7 system types. The 5 TEXT/URL
// types use the plain fields; file/image use the FileUpload (R2). Derived from
// already-fetched item types with singular labels, so callers don't run an extra
// query. Ordered by the canonical sidebar TYPE_ORDER for a stable pill order.
export function toCreatableTypes(
  types: { name: string; icon: string; color: string }[],
): CreatableType[] {
  return types
    .map((type) => ({
      name: type.name,
      label: toLabel(type.name),
      icon: type.icon,
      color: type.color,
    }))
    .sort((a, b) => TYPE_ORDER.indexOf(a.name) - TYPE_ORDER.indexOf(b.name));
}
