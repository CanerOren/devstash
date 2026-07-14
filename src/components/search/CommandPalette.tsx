"use client";

import { createElement } from "react";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { useSearch } from "@/components/search/search-context";
import { useItemDrawer } from "@/components/items/item-drawer-context";
import { commandFilter } from "@/lib/search-filter";
import type { SearchItem } from "@/lib/db/search";

// The Cmd/Ctrl+K command palette: fuzzy search over the pre-fetched items and
// collections, grouped into two sections. cmdk handles the fuzzy matching and
// keyboard navigation (arrows + Enter) for us. Rendered inside the item-drawer
// provider so selecting an item can open the existing drawer.
export function CommandPalette() {
  const { open, setOpen, data } = useSearch();
  const { openItem } = useItemDrawer();
  const router = useRouter();

  function handleSelectItem(item: SearchItem) {
    setOpen(false);
    openItem(item); // SearchItem is a DashboardItem, so the drawer opens directly
  }

  function handleSelectCollection(id: string) {
    setOpen(false);
    router.push(`/collections/${id}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search across your items and collections"
      filter={commandFilter}
    >
      <CommandInput placeholder="Search items and collections..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {data.items.length > 0 && (
          <CommandGroup heading="Items">
            {data.items.map((item) => (
              <CommandItem
                // value is the id (unique identity; our filter ignores it).
                // keywords[0] is the label the filter fuzzy-matches; tags +
                // content follow as substring-only secondary text.
                key={item.id}
                value={item.id}
                keywords={[item.title, ...item.tags, item.contentPreview]}
                onSelect={() => handleSelectItem(item)}
              >
                {createElement(getTypeIcon(item.type.icon), {
                  style: { color: item.type.color },
                })}
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <CommandShortcut>{item.type.label}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {data.collections.length > 0 && (
          <CommandGroup heading="Collections">
            {data.collections.map((collection) => (
              <CommandItem
                key={collection.id}
                value={collection.id}
                keywords={[collection.name]}
                onSelect={() => handleSelectCollection(collection.id)}
              >
                <Folder className="text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {collection.name}
                </span>
                <CommandShortcut>
                  {collection.itemCount}{" "}
                  {collection.itemCount === 1 ? "item" : "items"}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
