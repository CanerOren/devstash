"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { EditCollectionDialog } from "@/components/items/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/items/DeleteCollectionDialog";

// The Edit / Favorite / Delete actions in the collection detail-page header.
// Edit and Delete are functional; Favorite is a placeholder button with no
// behavior yet (per the feature spec). After a delete the collection no longer
// exists, so we navigate back to /collections rather than refreshing in place.
export function CollectionDetailActions({
  collection,
}: {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <ActionButton
        icon={Star}
        label="Favorite"
        // Placeholder — reflects state but has no toggle behavior yet.
        active={collection.isFavorite}
        activeClassName="fill-amber-400 text-amber-400"
      />
      <ActionButton
        icon={Pencil}
        label="Edit"
        onClick={() => setEditing(true)}
      />
      <ActionButton
        icon={Trash2}
        label="Delete"
        onClick={() => setDeleting(true)}
        className="text-destructive hover:text-destructive"
      />

      <EditCollectionDialog
        collection={collection}
        open={editing}
        onOpenChange={setEditing}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={deleting}
        onOpenChange={setDeleting}
        onDeleted={() => router.push("/collections")}
      />
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active = false,
  activeClassName,
  className,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  activeClassName?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      <Icon className={cn("size-4", active && activeClassName)} />
    </button>
  );
}
