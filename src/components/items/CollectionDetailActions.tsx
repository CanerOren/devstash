"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { setCollectionFavorite } from "@/actions/collections";
import { EditCollectionDialog } from "@/components/items/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/items/DeleteCollectionDialog";

// The Edit / Favorite / Delete actions in the collection detail-page header.
// All three are functional. Favorite toggles optimistically (reverting on
// failure). After a delete the collection no longer exists, so we navigate back
// to /collections rather than refreshing in place.
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
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);
  const [favoritePending, setFavoritePending] = useState(false);

  async function toggleFavorite() {
    if (favoritePending) return;
    const next = !isFavorite;
    setFavoritePending(true);
    setIsFavorite(next); // optimistic

    const result = await setCollectionFavorite(collection.id, next);
    setFavoritePending(false);

    if (!result.success) {
      setIsFavorite(!next); // revert
      toast.error(result.error ?? "Failed to update favorite");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <ActionButton
        icon={Star}
        label={isFavorite ? "Unfavorite" : "Favorite"}
        active={isFavorite}
        activeClassName="fill-amber-400 text-amber-400"
        onClick={toggleFavorite}
        disabled={favoritePending}
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
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  activeClassName?: string;
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
        "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <Icon className={cn("size-4", active && activeClassName)} />
    </button>
  );
}
