import { createElement } from "react";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";

import { getCollectionDetail } from "@/lib/db/collections";
import { parsePageParam } from "@/lib/pagination";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageCard } from "@/components/items/ImageCard";
import { FileRow } from "@/components/items/FileRow";
import { CollectionDetailActions } from "@/components/items/CollectionDetailActions";
import { Pagination } from "@/components/pagination/Pagination";

// Reads live per-user data, so render on each request rather than prerendering.
export const dynamic = "force-dynamic";

// A single collection and the items it contains.
export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const collection = await getCollectionDetail(id, parsePageParam(pageParam));
  if (!collection) notFound();

  const { items, types, page, totalPages } = collection;

  // A collection can hold mixed types. Files and images are pulled into their
  // own sections — files as a single-column list (Drive/Dropbox style) and
  // images as a thumbnail gallery, matching their /items/[type] pages — while
  // every other type shows in the standard card grid.
  const fileItems = items.filter((item) => item.type.name === "file");
  const imageItems = items.filter((item) => item.type.name === "image");
  const otherItems = items.filter(
    (item) => item.type.name !== "file" && item.type.name !== "image",
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {collection.name}
              </h1>
              {collection.isFavorite && (
                <Star className="size-5 shrink-0 fill-amber-400 text-amber-400" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {collection.itemCount}{" "}
              {collection.itemCount === 1 ? "item" : "items"}
            </p>
            {collection.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {collection.description}
              </p>
            )}
          </div>

          <CollectionDetailActions
            collection={{
              id: collection.id,
              name: collection.name,
              description: collection.description,
              isFavorite: collection.isFavorite,
            }}
          />
        </div>

        {/* Item types present in this collection. */}
        {types.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {types.map((type) => (
              <span
                key={type.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
              >
                {createElement(getTypeIcon(type.icon), {
                  className: "size-3.5",
                  style: { color: type.color },
                })}
                {type.label}
                <span className="text-muted-foreground">{type.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <div className="space-y-8">
          {/* Standard item types in the card grid. */}
          {otherItems.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {otherItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Images as a thumbnail gallery. */}
          {imageItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Images</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {imageItems.map((item) => (
                  <ImageCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Files as a single-column list. */}
          {fileItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Files</h2>
              <div className="flex flex-col gap-2">
                {fileItems.map((item) => (
                  <FileRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            This collection has no items yet.
          </p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        basePath={`/collections/${id}`}
      />
    </div>
  );
}
