"use client";

import { createElement, useState } from "react";
import { Pin, Star } from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { useItemDrawer } from "@/components/items/item-drawer-context";

// A thumbnail card for image items, used in place of ItemCard in the image
// gallery. Shows the image at a 16:9 aspect ratio (cropped to fill) with a
// subtle hover zoom; clicking opens the item drawer (the detail view).
export function ImageCard({ item }: { item: DashboardItem }) {
  const itemType = item.type;
  const { openItem } = useItemDrawer();
  const [imgError, setImgError] = useState(false);

  // Serve the image through our own origin (streams from R2's S3 endpoint)
  // rather than the flaky public r2.dev URL. Falls back to the type icon if the
  // request still fails.
  const showImage = Boolean(item.fileUrl) && !imgError;

  return (
    <button
      type="button"
      onClick={() => openItem(item)}
      className="group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:bg-accent/40"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/items/${item.id}/image`}
            alt={item.title}
            onError={() => setImgError(true)}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            {createElement(getTypeIcon(itemType.icon), {
              className: "size-8 text-muted-foreground",
            })}
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="flex min-w-0 items-center gap-1.5 p-3">
        <h4 className="truncate text-sm font-medium">{item.title}</h4>
        {item.isPinned && (
          <Pin className="size-3 shrink-0 text-muted-foreground" />
        )}
        {item.isFavorite && (
          <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
        )}
      </div>
    </button>
  );
}
