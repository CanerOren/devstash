import { createElement } from "react";
import { notFound } from "next/navigation";

import { getItemsByType } from "@/lib/db/items";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { ItemCard } from "@/components/dashboard/ItemCard";

// Reads live per-user data, so render on each request rather than prerendering.
export const dynamic = "force-dynamic";

// Type-filtered items list, e.g. /items/snippets or /items/notes.
export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const result = await getItemsByType(type);
  if (!result) notFound();

  const { type: itemType, items } = result;
  const pluralLabel = `${itemType.label}s`;

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
      </div>

      {/* Items grid */}
      {items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
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
