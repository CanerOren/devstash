import { createElement } from "react";
import { notFound } from "next/navigation";

import {
  getItemsByType,
  getSidebarItemTypes,
  toCreatableTypes,
} from "@/lib/db/items";
import { getCollectionOptions } from "@/lib/db/collections";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageCard } from "@/components/items/ImageCard";
import { FileRow } from "@/components/items/FileRow";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";

// Reads live per-user data, so render on each request rather than prerendering.
export const dynamic = "force-dynamic";

// Type-filtered items list, e.g. /items/snippets or /items/notes.
export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const [result, itemTypes, collectionOptions] = await Promise.all([
    getItemsByType(type),
    getSidebarItemTypes(),
    getCollectionOptions(),
  ]);
  if (!result) notFound();

  const { type: itemType, items } = result;
  const pluralLabel = `${itemType.label}s`;

  // Image items render as a thumbnail gallery instead of the standard list card.
  const isImageGallery = itemType.name === "image";
  // File items render as a single-column list (Drive/Dropbox style).
  const isFileList = itemType.name === "file";

  // Preselect this type in the create modal. All system types are creatable
  // (file/image via R2 upload); the guard stays as defense in case that changes.
  const createTypes = toCreatableTypes(itemTypes);
  const canCreate = createTypes.some((t) => t.name === itemType.name);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${itemType.color}1a` }}
        >
          {createElement(getTypeIcon(itemType.icon), {
            className: "size-5",
            style: { color: itemType.color },
          })}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {pluralLabel}
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        {canCreate && (
          <div className="ml-auto">
            <CreateItemDialog
              types={createTypes}
              collections={collectionOptions}
              defaultType={itemType.name}
              triggerLabel={`New ${itemType.label}`}
            />
          </div>
        )}
      </div>

      {/* Items — file items as a single-column list, images as a gallery grid,
          everything else as the standard card grid. */}
      {items.length > 0 ? (
        isFileList ? (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <FileRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) =>
              isImageGallery ? (
                <ImageCard key={item.id} item={item} />
              ) : (
                <ItemCard key={item.id} item={item} />
              ),
            )}
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No {pluralLabel.toLowerCase()} yet.
          </p>
        </div>
      )}
    </div>
  );
}
