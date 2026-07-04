"use client";

import { createElement, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Pin,
  Star,
  Trash2,
} from "lucide-react";

import type { DashboardItem, ItemDetail } from "@/lib/db/items";
import { updateItem, deleteItem } from "@/actions/items";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/file-constraints";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ItemEditForm,
  initialEditState,
  type ItemEditState,
} from "@/components/items/ItemEditForm";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  // Called with the refreshed detail after a successful inline edit.
  onUpdated: (detail: ItemDetailResponse) => void;
  // Called after a successful delete so the container can close the drawer.
  onDeleted: () => void;
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
  onUpdated,
  onDeleted,
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
            <ActionBar
              key={detail?.id ?? "loading"}
              isFavorite={isFavorite}
              isPinned={isPinned}
              detail={detail}
              onEdit={startEditing}
              onDelete={handleDelete}
              deleting={deleting}
              title={title}
            />
          )}
        </SheetHeader>

        {/* Body */}
        <div className="space-y-6 p-6">
          {editing && form && type ? (
            <ItemEditForm typeName={type.name} value={form} onChange={setForm} />
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

// Code types get the Monaco editor for their content; markdown types (note,
// prompt) get the rendered Markdown preview; the rest keep a plain block.
const CODE_TYPES = new Set(["snippet", "command"]);
const MARKDOWN_TYPES = new Set(["note", "prompt"]);

// Renders the item's content per its content type: the Monaco code editor for
// snippet/command TEXT items, the Markdown preview for note/prompt items, a
// plain block for other text, the link for URL items, and file info for FILE.
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
    const isImage = detail.type.name === "image";
    return (
      <div className="space-y-3">
        {isImage && detail.fileUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            // Served through our origin (streams from R2's S3 endpoint) rather
            // than the flaky public r2.dev URL.
            src={`/api/items/${detail.id}/image`}
            alt={detail.fileName ?? detail.title}
            className="max-h-96 w-auto max-w-full rounded-lg border border-border object-contain"
          />
        )}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/50">
              <FileText className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {detail.fileName ?? "Attached file"}
              </p>
              {detail.fileSize != null && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(detail.fileSize)}
                </p>
              )}
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <a href={`/api/items/${detail.id}/download`} download>
              <Download className="size-4" />
              Download
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (detail.content) {
    if (CODE_TYPES.has(detail.type.name)) {
      return (
        <CodeEditor value={detail.content} language={detail.language} readOnly />
      );
    }
    if (MARKDOWN_TYPES.has(detail.type.name)) {
      return <MarkdownEditor value={detail.content} readOnly />;
    }
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs leading-relaxed">
        <code>{detail.content}</code>
      </pre>
    );
  }

  return <p className="text-sm text-muted-foreground">No content.</p>;
}

// The action bar. Copy, Edit, and Delete are functional; favorite/pin reflect
// state but their mutations are deferred to a later feature (per the drawer spec).
function ActionBar({
  isFavorite,
  isPinned,
  detail,
  onEdit,
  onDelete,
  deleting,
  title,
}: {
  isFavorite: boolean;
  isPinned: boolean;
  detail: ItemDetailResponse | null;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  title: string;
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
      {/* Edit needs the loaded detail to populate the form. */}
      <ActionButton
        icon={Pencil}
        label="Edit"
        onClick={onEdit}
        disabled={!detail}
      />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            title="Delete"
            aria-label="Delete"
            disabled={!detail}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-accent hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete
              {title ? ` “${title}”` : " this item"}. This action can&apos;t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                // Keep the dialog open while the delete is in flight; the drawer
                // (and this dialog with it) unmounts on success.
                event.preventDefault();
                onDelete();
              }}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
