"use client";

import { createElement, useState } from "react";
import { Check, Copy, Loader2, Pencil, Pin, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
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
import type { ItemDetailResponse } from "@/components/items/item-detail-response";

// The action bar. Copy, Edit, and Delete are functional; favorite/pin reflect
// state but their mutations are deferred to a later feature (per the drawer spec).
export function ItemActionBar({
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
