"use client";

import { createElement, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";
import { updateItem, deleteItem } from "@/actions/items";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { formatFullDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ItemEditForm,
  initialEditState,
  type ItemEditState,
} from "@/components/items/ItemEditForm";
import { ItemContentBlock } from "@/components/items/ItemContentBlock";
import { ItemActionBar } from "@/components/items/ItemActionBar";
import { Section, DetailRow } from "@/components/items/drawer-primitives";
import { keepModalOpenOnToastInteract } from "@/lib/modal-dismiss";
import type { ItemDetailResponse } from "@/components/items/item-detail-response";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type { ItemDetailResponse } from "@/components/items/item-detail-response";

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The card's known data, shown immediately so the header doesn't flash.
  summary: DashboardItem | null;
  // Full detail, loaded on open. Null while fetching.
  detail: ItemDetailResponse | null;
  loading: boolean;
  error: string | null;
  // Called with the refreshed detail after a successful inline edit.
  onUpdated: (detail: ItemDetailResponse) => void;
  // Called after a successful delete so the container can close the drawer.
  onDeleted: () => void;
  // Toggles the item's favorite flag (optimistic; owned by the container).
  onToggleFavorite: () => void;
  favoritePending: boolean;
  // Toggles the item's pinned flag (optimistic; owned by the container).
  onTogglePin: () => void;
  pinPending: boolean;
  // The user's collections, for the edit form's collection multi-select.
  collections: CollectionOption[];
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
  onUpdated,
  onDeleted,
  onToggleFavorite,
  favoritePending,
  onTogglePin,
  pinPending,
  collections,
}: ItemDrawerProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ItemEditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Leave edit mode whenever the drawer switches to a different item. Adjusting
  // state during render (the React-recommended pattern for resetting on a prop
  // change) avoids an effect + the cascading-render lint rule.
  const [prevDetailId, setPrevDetailId] = useState(detail?.id);
  if (detail?.id !== prevDetailId) {
    setPrevDetailId(detail?.id);
    setEditing(false);
    setForm(null);
  }

  // Prefer fresh detail, fall back to the card summary while it loads.
  const type = detail?.type ?? summary?.type ?? null;
  const title = detail?.title ?? summary?.title ?? "";
  const description = detail?.description ?? summary?.description ?? null;
  const tags = detail?.tags ?? summary?.tags ?? [];
  const isFavorite = detail?.isFavorite ?? summary?.isFavorite ?? false;
  const isPinned = detail?.isPinned ?? summary?.isPinned ?? false;

  function startEditing() {
    if (!detail) return;
    setForm(initialEditState(detail));
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setForm(null);
  }

  async function handleSave() {
    if (!detail || !form || !form.title.trim()) return;

    setSaving(true);
    const result = await updateItem(detail.id, {
      title: form.title.trim(),
      description: form.description,
      content: form.content,
      url: form.url,
      language: form.language,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      collectionIds: form.collectionIds,
    });
    setSaving(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Failed to update item");
      return;
    }

    // The action returns ItemDetail (Date objects); mirror the wire shape the
    // drawer state uses (ISO strings).
    const updated = result.data;
    onUpdated({
      ...updated,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString(),
    });
    setEditing(false);
    setForm(null);
    router.refresh(); // reflect changes in the underlying card list
    toast.success("Item updated");
  }

  async function handleDelete() {
    if (!detail) return;

    setDeleting(true);
    const result = await deleteItem(detail.id);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to delete item");
      return;
    }

    onDeleted(); // close the drawer
    router.refresh(); // drop the item from the underlying card list
    toast.success("Item deleted");
  }

  // Reset edit state when the drawer closes.
  function handleOpenChange(next: boolean) {
    if (!next) {
      setEditing(false);
      setForm(null);
    }
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {/* Override the Sheet's built-in `data-[side=right]:sm:max-w-sm` cap (its
          attribute selector wins on specificity) with the same modifier prefix
          so the drawer can actually grow wider. */}
      <SheetContent
        className="gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl data-[side=right]:lg:max-w-4xl data-[side=right]:xl:max-w-5xl"
        // Don't close the drawer when the user clicks a toast action (e.g. Undo).
        onInteractOutside={keepModalOpenOnToastInteract}
      >
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
                {editing ? form?.title || "Untitled" : title}
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

          {editing ? (
            // In edit mode the action bar is replaced with Save / Cancel.
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving || !form?.title.trim()}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          ) : (
            // Keyed by item id so per-item state (e.g. "Copied!") resets when the
            // drawer switches to a different item.
            <ItemActionBar
              key={detail?.id ?? "loading"}
              isFavorite={isFavorite}
              isPinned={isPinned}
              detail={detail}
              onEdit={startEditing}
              onDelete={handleDelete}
              onToggleFavorite={onToggleFavorite}
              favoritePending={favoritePending}
              onTogglePin={onTogglePin}
              pinPending={pinPending}
              deleting={deleting}
              title={title}
            />
          )}
        </SheetHeader>

        {/* Body */}
        <div className="space-y-6 p-6">
          {editing && form && type ? (
            <ItemEditForm
              typeName={type.name}
              value={form}
              onChange={setForm}
              collections={collections}
            />
          ) : error ? (
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
                  <ItemContentBlock detail={detail} />
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
