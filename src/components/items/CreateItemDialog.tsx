"use client";

import { createElement, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
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
import { getTypeIcon } from "@/components/dashboard/type-icons";
import {
  ItemEditForm,
  type ItemEditState,
} from "@/components/items/ItemEditForm";
import { createItem } from "@/actions/items";

// A creatable item type descriptor for the type selector (5 TEXT/URL types).
export interface CreatableType {
  name: string; // raw type name, e.g. "snippet" — must match the server enum
  label: string; // display label, e.g. "Snippet"
  icon: string; // Lucide icon name, e.g. "Code"
  color: string; // hex, e.g. "#3b82f6"
}

const BLANK_FORM: ItemEditState = {
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: "",
};

// The "New Item" button + its create modal. Opened from the top bar. Reuses the
// drawer's ItemEditForm for the fields, with a type selector on top; on success
// it toasts, closes, and refreshes the page so the new item appears in the lists.
export function CreateItemDialog({ types }: { types: CreatableType[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(types[0]?.name ?? "snippet");
  const [form, setForm] = useState<ItemEditState>(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    // Reset to a blank form each time the dialog opens.
    if (next) {
      setType(types[0]?.name ?? "snippet");
      setForm(BLANK_FORM);
      setError(null);
    }
    setOpen(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
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
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
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
        <Button size="sm">
          <Plus />
          New Item
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
            <div className="flex flex-wrap gap-2">
              {types.map((t) => {
                const selected = t.name === type;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setType(t.name)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                      selected
                        ? "border-transparent"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                    // Selected pill is tinted with the type's color (data-driven).
                    style={
                      selected
                        ? { backgroundColor: `${t.color}1a`, color: t.color }
                        : undefined
                    }
                  >
                    {createElement(getTypeIcon(t.icon), { className: "size-3.5" })}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <ItemEditForm typeName={type} value={form} onChange={setForm} />

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
            <Button type="submit" disabled={submitting || !form.title.trim()}>
              {submitting ? "Creating..." : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
