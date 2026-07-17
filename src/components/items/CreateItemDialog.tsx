"use client";

import { createElement, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import {
  ItemEditForm,
  type ItemEditState,
} from "@/components/items/ItemEditForm";
import {
  FileUpload,
  type UploadedFile,
} from "@/components/items/FileUpload";
import { createItem } from "@/actions/items";
import type { CreatableType } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";
import { isFileCategory } from "@/lib/file-constraints";

const BLANK_FORM: ItemEditState = {
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: "",
  collectionIds: [],
};

interface CreateItemDialogProps {
  types: CreatableType[];
  // The user's collections, for the collection multi-select.
  collections: CollectionOption[];
  // Type to preselect when the dialog opens (e.g. the current /items/[type]
  // page). Falls back to the first creatable type.
  defaultType?: string;
  // Label for the trigger button (e.g. "New Snippet"). Defaults to "New Item".
  triggerLabel?: string;
  // Drops the trigger label below `sm` (icon only) for callers whose row is too
  // tight for it on mobile — the top bar.
  compact?: boolean;
}

// The "New Item" button + its create modal. Opened from the top bar (and the
// type pages). Reuses the drawer's ItemEditForm for the fields, with a type
// selector on top; on success it toasts, closes, and refreshes the page so the
// new item appears in the lists.
export function CreateItemDialog({
  types,
  collections,
  defaultType,
  triggerLabel = "New Item",
  compact = false,
}: CreateItemDialogProps) {
  const router = useRouter();
  // The preselected type, if it's actually creatable; else the first one.
  const initialType =
    (defaultType && types.some((t) => t.name === defaultType)
      ? defaultType
      : types[0]?.name) ?? "snippet";
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(initialType);
  const [form, setForm] = useState<ItemEditState>(BLANK_FORM);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFileType = isFileCategory(type);
  // The currently selected type, for the dropdown trigger's icon + label.
  const selectedType = types.find((t) => t.name === type);

  function handleOpenChange(next: boolean) {
    // Reset to a blank form (and the preselected type) each time it opens.
    if (next) {
      setType(initialType);
      setForm(BLANK_FORM);
      setFile(null);
      setError(null);
    }
    setOpen(next);
  }

  // Switch types — reset the uploaded file so it can't leak onto a non-file type.
  function handleTypeChange(next: string) {
    setType(next);
    setFile(null);
    setError(null);
  }

  // When a file finishes uploading, default the title to its name (sans
  // extension) if the user hasn't typed one yet.
  function handleFileChange(next: UploadedFile | null) {
    setFile(next);
    if (next && !form.title.trim()) {
      const base = next.fileName.replace(/\.[^.]+$/, "");
      setForm((prev) => ({ ...prev, title: base }));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (isFileType && !file) {
      setError("Please upload a file first.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await createItem({
      type,
      title: form.title,
      description: form.description,
      content: form.content,
      url: form.url,
      language: form.language,
      fileUrl: file?.fileUrl ?? null,
      fileName: file?.fileName ?? null,
      fileSize: file?.fileSize ?? null,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      collectionIds: form.collectionIds,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not create item.");
      toast.error(result.error ?? "Could not create item.");
      return;
    }

    toast.success("Item created");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" aria-label={compact ? triggerLabel : undefined}>
          <Plus />
          <span className={compact ? "hidden sm:inline" : undefined}>
            {triggerLabel}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>Add a new item to your stash.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Type</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <span className="flex items-center gap-2">
                    {selectedType &&
                      createElement(getTypeIcon(selectedType.icon), {
                        className: "size-4",
                        style: { color: selectedType.color },
                      })}
                    {selectedType?.label ?? "Select type"}
                  </span>
                  <ChevronDown className="size-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-h-64 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
              >
                {types.map((t) => (
                  <DropdownMenuItem
                    key={t.name}
                    onSelect={() => handleTypeChange(t.name)}
                  >
                    {createElement(getTypeIcon(t.icon), {
                      className: "size-4",
                      style: { color: t.color },
                    })}
                    {t.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isFileType && (
            <div className="space-y-2">
              <Label>{type === "image" ? "Image" : "File"}</Label>
              <FileUpload
                category={type === "image" ? "image" : "file"}
                value={file}
                onChange={handleFileChange}
              />
            </div>
          )}

          <ItemEditForm
            typeName={type}
            value={form}
            onChange={setForm}
            collections={collections}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting || !form.title.trim() || (isFileType && !file)
              }
            >
              {submitting ? "Creating..." : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
