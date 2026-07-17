"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCollection } from "@/actions/collections";

interface CollectionForm {
  name: string;
  description: string;
}

const BLANK_FORM: CollectionForm = { name: "", description: "" };

// The "New Collection" button + its create modal. Opened from the top bar. On
// success it toasts, closes, and refreshes the page so the new collection
// appears in the dashboard grid + sidebar.
// `compact` drops the trigger label below `sm` (icon only) for callers whose row
// is too tight for it on mobile — the top bar.
export function CreateCollectionDialog({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CollectionForm>(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    // Reset to a blank form each time it opens.
    if (next) {
      setForm(BLANK_FORM);
      setError(null);
    }
    setOpen(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await createCollection({
      name: form.name,
      description: form.description,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not create collection.");
      toast.error(result.error ?? "Could not create collection.");
      return;
    }

    toast.success("Collection created");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={compact ? "New collection" : undefined}
        >
          <FolderPlus />
          <span className={compact ? "hidden sm:inline" : undefined}>
            New Collection
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Group items of any type into a named collection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. React Patterns"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-description">Description</Label>
            <Textarea
              id="collection-description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="What's this collection for? (optional)"
              rows={3}
            />
          </div>

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
            <Button type="submit" disabled={submitting || !form.name.trim()}>
              {submitting ? "Creating..." : "Create collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
