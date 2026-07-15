"use client";

import { createElement } from "react";

import type { FavoriteItem } from "@/lib/db/items";
import { formatShortDate } from "@/lib/format";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { useItemDrawer } from "@/components/items/item-drawer-context";

// A dense, terminal-style row for a favorited item: type icon, title, type
// badge, and the date it was favorited (updatedAt). Clicking opens the item
// drawer — full detail is fetched there on demand.
export function FavoriteItemRow({ item }: { item: FavoriteItem }) {
  const { openItem } = useItemDrawer();
  const type = item.type;

  return (
    <button
      type="button"
      onClick={() => openItem(item)}
      className="group flex w-full items-center gap-3 px-3 py-2 text-left font-mono text-sm transition-colors hover:bg-accent/40"
    >
      {createElement(getTypeIcon(type.icon), {
        className: "size-4 shrink-0",
        style: { color: type.color },
      })}
      <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
      <span
        className="hidden shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wider sm:inline-block"
        style={{ backgroundColor: `${type.color}1a`, color: type.color }}
      >
        {type.label}
      </span>
      <time className="shrink-0 text-xs text-muted-foreground">
        {formatShortDate(item.updatedAt)}
      </time>
    </button>
  );
}
