import { getCollectionsPage } from "@/lib/db/collections";
import { parsePageParam } from "@/lib/pagination";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { Pagination } from "@/components/pagination/Pagination";

// Reads live per-user data, so render on each request rather than prerendering.
export const dynamic = "force-dynamic";

// All of the current user's collections, paginated.
export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const { collections, totalCount, page, totalPages } =
    await getCollectionsPage(parsePageParam(pageParam));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "collection" : "collections"}
        </p>
      </div>

      {/* Collections grid */}
      {collections.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No collections yet. Create one from the top bar.
          </p>
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} basePath="/collections" />
    </div>
  );
}
