"use client";

import { createElement, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Pencil,
  Pin,
  Star,
  Trash2,
} from "lucide-react";

import type { DashboardItem, ItemDetail } from "@/lib/db/items";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Dates serialize to ISO strings over the API, so the client detail mirrors
// ItemDetail with string dates instead of Date.
export type ItemDetailResponse = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The card's known data, shown immediately so the header doesn't flash.
  summary: DashboardItem | null;
  // Full detail, loaded on open. Null while fetching.
  detail: ItemDetailResponse | null;
  loading: boolean;
  error: string | null;
}

// Formats a date as "January 15, 2024".
function formatFullDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// The item detail drawer — a right-side Sheet that doubles as the item view.
// The header + description + tags come from the card summary (instant), while
// content, collections, and dates stream in from the on-click detail fetch.
export function ItemDrawer({
  open,
  onOpenChange,
  summary,
  detail,
  loading,
  error,
}: ItemDrawerProps) {
  // Prefer fresh detail, fall back to the card summary while it loads.
  const type = detail?.type ?? summary?.type ?? null;
  const title = detail?.title ?? summary?.title ?? "";
  const description = detail?.description ?? summary?.description ?? null;
  const tags = detail?.tags ?? summary?.tags ?? [];
  const isFavorite = detail?.isFavorite ?? summary?.isFavorite ?? false;
  const isPinned = detail?.isPinned ?? summary?.isPinned ?? false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Override the Sheet's built-in `data-[side=right]:sm:max-w-sm` cap (its
          attribute selector wins on specificity) with the same modifier prefix
          so the drawer can actually grow wider. */}
      <SheetContent className="gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl data-[side=right]:lg:max-w-4xl data-[side=right]:xl:max-w-5xl">
        {/* Header: icon chip, title, type + language badges */}
        <SheetHeader className="gap-3 border-b border-border p-6 pr-14">
          <div className="flex items-start gap-3">
            {type && (
              <span
                className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${type.color}1a` }}
              >
                {createElement(getTypeIcon(type.icon), {
                  className: "size-5",
                  style: { color: type.color },
                })}
              </span>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <SheetTitle className="text-lg leading-tight break-words">
                {title}
              </SheetTitle>
              {/* Visually hidden — satisfies Radix's aria-describedby requirement. */}
              <SheetDescription className="sr-only">
                {description ?? `Details for ${title || "this item"}`}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2">
                {type && <Badge variant="secondary">{type.label}s</Badge>}
                {detail?.language && (
                  <Badge variant="outline">{detail.language}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Keyed by item id so per-item state (e.g. "Copied!") resets when the
              drawer switches to a different item. */}
          <ActionBar
            key={detail?.id ?? "loading"}
            isFavorite={isFavorite}
            isPinned={isPinned}
            detail={detail}
          />
        </SheetHeader>

        {/* Body */}
        <div className="space-y-6 p-6">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <>
              {/* Description (from summary — instant) */}
              {description && (
                <Section label="Description">
                  <p className="text-sm text-foreground">{description}</p>
                </Section>
              )}

              {/* Content (from detail) */}
              <Section label="Content">
                {loading && !detail ? (
                  <Skeleton className="h-32 w-full rounded-lg" />
                ) : (
                  <ContentBlock detail={detail} />
                )}
              </Section>

              {/* Tags (from summary — instant) */}
              {tags.length > 0 && (
                <Section label="Tags">
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </Section>
              )}

              {/* Collections (from detail) */}
              <Section label="Collections">
                {loading && !detail ? (
                  <Skeleton className="h-6 w-40 rounded-md" />
                ) : detail && detail.collections.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.collections.map((collection) => (
                      <Badge key={collection.id} variant="outline">
                        {collection.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Not in any collection.
                  </p>
                )}
              </Section>

              {/* Details (from detail) */}
              <Section label="Details">
                {loading && !detail ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : detail ? (
                  <dl className="space-y-2 text-sm">
                    <DetailRow
                      term="Created"
                      value={formatFullDate(detail.createdAt)}
                    />
                    <DetailRow
                      term="Updated"
                      value={formatFullDate(detail.updatedAt)}
                    />
                  </dl>
                ) : null}
              </Section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// A labelled body section with the small uppercase-ish muted heading.
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
      {children}
    </section>
  );
}

function DetailRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

// Renders the item's content per its content type: a code/text block for TEXT,
// the link for URL items, and file info for FILE items. Syntax highlighting and
// the code editor are deferred to a later feature.
function ContentBlock({ detail }: { detail: ItemDetailResponse | null }) {
  if (!detail) return null;

  if (detail.contentType === "URL" && detail.url) {
    return (
      <a
        href={detail.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ExternalLink className="size-3.5" />
        {detail.url}
      </a>
    );
  }

  if (detail.contentType === "FILE") {
    return (
      <p className="text-sm text-muted-foreground">
        {detail.fileName ?? "Attached file"}
        {detail.fileSize != null && ` · ${formatFileSize(detail.fileSize)}`}
      </p>
    );
  }

  if (detail.content) {
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs leading-relaxed">
        <code>{detail.content}</code>
      </pre>
    );
  }

  return <p className="text-sm text-muted-foreground">No content.</p>;
}

// Formats a byte count as a human-readable size, e.g. 2048 → "2.0 KB".
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(1)} ${units[unit]}`;
}

// The action bar. Copy is functional; favorite/pin/edit/delete reflect state but
// their mutations are deferred to a later feature (per the drawer spec).
function ActionBar({
  isFavorite,
  isPinned,
  detail,
}: {
  isFavorite: boolean;
  isPinned: boolean;
  detail: ItemDetailResponse | null;
}) {
  const [copied, setCopied] = useState(false);

  const copyText = detail?.content ?? detail?.url ?? "";

  async function handleCopy() {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context) — fail silently.
    }
  }

  return (
    <div className="flex items-center gap-1">
      <ActionButton
        icon={Star}
        label="Favorite"
        active={isFavorite}
        activeClassName="fill-amber-400 text-amber-400"
      />
      <ActionButton icon={Pin} label="Pin" active={isPinned} />
      <ActionButton
        icon={copied ? Check : Copy}
        label={copied ? "Copied" : "Copy"}
        onClick={handleCopy}
        disabled={!copyText}
      />
      <ActionButton icon={Pencil} label="Edit" />

      <ActionButton
        icon={Trash2}
        label="Delete"
        hideLabel
        className="ml-auto text-destructive hover:text-destructive"
      />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  active = false,
  activeClassName,
  hideLabel = false,
  className,
  onClick,
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  activeClassName?: string;
  hideLabel?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {createElement(icon, {
        className: cn("size-4", active && activeClassName),
      })}
      {!hideLabel && <span>{label}</span>}
    </button>
  );
}
