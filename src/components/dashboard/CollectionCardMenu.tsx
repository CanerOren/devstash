"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditCollectionDialog } from "@/components/items/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/items/DeleteCollectionDialog";

// The ⋯ menu for a collection card. Sits as a sibling on top of the card's
// full-card navigation overlay, so opening the menu (or picking an action)
// doesn't also navigate to the collection. Edit/Delete are functional; Favorite
// is a placeholder button with no behavior yet (per the feature spec).
export function CollectionCardMenu({
  collection,
}: {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="relative z-10 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Collection actions"
            // Stop the click from reaching the card's navigation overlay.
            onClick={(e) => e.stopPropagation()}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          {/* Favorite toggle is a placeholder for now — no behavior yet. */}
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="text-muted-foreground"
          >
            <Star
              className={
                collection.isFavorite
                  ? "size-4 fill-amber-400 text-amber-400"
                  : "size-4"
              }
            />
            Favorite
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleting(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCollectionDialog
        collection={collection}
        open={editing}
        onOpenChange={setEditing}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={deleting}
        onOpenChange={setDeleting}
      />
    </div>
  );
}
