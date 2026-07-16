"use client";

import { createElement } from "react";
import {
  Download,
  File,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  Star,
  type LucideIcon,
} from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";
import { fileExtension, formatFileSize } from "@/lib/file-constraints";
import { useItemDrawer } from "@/components/items/item-drawer-context";
import { cn } from "@/lib/utils";

// Maps a file extension to a Lucide icon, so a row hints at its content type.
const ICON_BY_EXT: Record<string, LucideIcon> = {
  ".pdf": FileText,
  ".txt": FileText,
  ".md": FileText,
  ".json": FileJson,
  ".yaml": FileCode,
  ".yml": FileCode,
  ".xml": FileCode,
  ".toml": FileCode,
  ".ini": FileCode,
  ".csv": FileSpreadsheet,
};

function iconForFile(fileName: string | null): LucideIcon {
  if (!fileName) return File;
  return ICON_BY_EXT[fileExtension(fileName)] ?? File;
}

// Formats a date as "Jan 15, 2026".
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// A single-column list row for a file item (Google Drive / Dropbox style): icon
// by extension, file name, size, and upload date, with a download button on the
// right. Clicking the row opens the item drawer; the download button streams the
// file via the download proxy and stops propagation so it doesn't open the drawer.
export function FileRow({ item }: { item: DashboardItem }) {
  const { openItem } = useItemDrawer();
  const Icon = iconForFile(item.fileName);
  const name = item.fileName ?? item.title;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3",
        "transition-colors hover:bg-accent/40",
      )}
      style={{ borderLeftColor: item.type.color, borderLeftWidth: 2 }}
    >
      {/* Clicking the row (icon + info) opens the drawer. */}
      <button
        type="button"
        onClick={() => openItem(item)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${item.type.color}1a` }}
        >
          {createElement(Icon, {
            className: "size-4.5",
            style: { color: item.type.color },
          })}
        </span>

        {/* Info: stacks vertically on mobile, spreads into columns on sm+. */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
          <span className="flex min-w-0 flex-col sm:flex-1">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-medium">{item.title}</span>
              {item.isFavorite && (
                <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
              )}
            </span>
            {item.fileName && (
              <span className="truncate text-xs text-muted-foreground">
                {item.fileName}
              </span>
            )}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground sm:w-20 sm:text-right">
            {formatFileSize(item.fileSize)}
          </span>
          <time className="shrink-0 text-xs text-muted-foreground sm:w-28 sm:text-right">
            {formatDate(item.createdAt)}
          </time>
        </div>
      </button>

      {/* Download: streams via the proxy route; stops propagation so the row
          click (drawer) doesn't also fire. */}
      <a
        href={`/api/items/${item.id}/download`}
        onClick={(e) => e.stopPropagation()}
        download
        aria-label={`Download ${name}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-colors hover:bg-accent hover:text-foreground focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Download className="size-4" />
      </a>
    </div>
  );
}
