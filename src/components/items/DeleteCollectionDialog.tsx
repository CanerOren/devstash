"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteCollection } from "@/actions/collections";

// A controlled delete-confirmation for a collection. Open state is owned by the
// parent (trigger lives in a card's ⋯ menu or the detail-page header). Deleting
// removes only the collection — its items are preserved and simply leave it.
// By default it refreshes the current route; pass `onDeleted` to override (e.g.
// the detail page navigates away since the collection no longer exists).
export function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
  onDeleted,
}: {
  collection: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCollection(collection.id);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not delete collection.");
      return;
    }

    toast.success("Collection deleted");
    onOpenChange(false);
    if (onDeleted) {
      onDeleted();
    } else {
      router.refresh();
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes {collection.name ? `“${collection.name}”` : "this collection"}.
            The items inside it are <strong>not</strong> deleted — they&apos;ll
            just no longer belong to this collection. This action can&apos;t be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              // Keep the dialog open while the delete is in flight.
              event.preventDefault();
              handleDelete();
            }}
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
