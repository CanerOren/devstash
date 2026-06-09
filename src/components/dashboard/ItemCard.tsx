import { createElement } from "react";
import { Pin, Star } from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";
import { getTypeIcon } from "@/components/dashboard/type-icons";

// Formats a date as "Jan 15".
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// A horizontal item row used in the Pinned and Recent lists. The left border is
// tinted with the item type's color (per the project UI rules).
export function ItemCard({ item }: { item: DashboardItem }) {
  const itemType = item.type;
  return (
    <div
      className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/40"
      // Item type color is data-driven, so the accent border must be inline.
      style={{ borderLeftColor: itemType.color, borderLeftWidth: 2 }}
    >
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${itemType.color}1a` }}
      >
        {createElement(getTypeIcon(itemType.icon), {
          className: "size-4",
          style: { color: itemType.color },
        })}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="truncate text-sm font-medium">{item.title}</h4>
          {item.isPinned && (
            <Pin className="size-3 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
          )}
        </div>

        {item.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.description}
          </p>
        )}

        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary px-1.5 py-0.5 text-[0.65rem] text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <time className="shrink-0 text-xs text-muted-foreground">
        {formatDate(item.createdAt)}
      </time>
    </div>
  );
}
