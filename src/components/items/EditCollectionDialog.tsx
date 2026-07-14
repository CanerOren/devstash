"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/dialog";
import { updateCollection } from "@/actions/collections";

// The metadata this dialog edits. Kept minimal so any surface (cards, detail
// page) can pass just what it has.
export interface EditableCollection {
  id: string;
  name: string;
  description: string | null;
}

// A controlled modal for editing a collection's metadata (name/description).
// Open state is owned by the parent so the trigger can live wherever (a card's
// ⋯ menu, the detail-page header). On success it toasts, closes, and refreshes
// so the change shows across the dashboard grid, /collections, and sidebar.
export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: {
  collection: EditableCollection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed the form from the collection whenever the dialog transitions to open —
  // done during render (React's "adjust state on prop change" pattern) rather
  // than in an effect, to avoid the cascading-render lint rule.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(collection.name);
      setDescription(collection.description ?? "");
      setError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await updateCollection(collection.id, { name, description });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not update collection.");
      toast.error(result.error ?? "Could not update collection.");
      return;
    }

    toast.success("Collection updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>
            Update this collection&apos;s name and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-collection-name">Name</Label>
            <Input
              id="edit-collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. React Patterns"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-collection-description">Description</Label>
            <Textarea
              id="edit-collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection for? (optional)"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
