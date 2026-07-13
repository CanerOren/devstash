import type { ItemDetail } from "@/lib/db/items";

// Dates serialize to ISO strings over the API, so the client detail mirrors
// ItemDetail with string dates instead of Date. Shared by the item drawer and
// its extracted sub-components (content block, action bar) plus the drawer
// context that fetches it.
export type ItemDetailResponse = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};
