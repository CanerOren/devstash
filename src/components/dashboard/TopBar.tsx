"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu, Search, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { useSearch } from "@/components/search/search-context";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { CreateCollectionDialog } from "@/components/items/CreateCollectionDialog";
import type { CreatableType } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";

// Read whether we're on a Mac without tripping a hydration mismatch: the server
// snapshot is always false (renders "Ctrl"), and the client snapshot corrects to
// ⌘ for Mac users after hydration. useSyncExternalStore keeps this out of an
// effect (the platform never changes, so `subscribe` is a no-op).
const subscribe = () => () => {};
const getIsMac = () => /mac|iphone|ipad|ipod/i.test(navigator.platform);
const getIsMacServer = () => false;

// Top bar for the dashboard shell.
// The search box opens the Cmd/Ctrl+K command palette; the menu button opens the
// sidebar drawer on mobile (desktop collapse lives inside the sidebar). The New
// Collection and New Item buttons open their respective create modals.
export function TopBar({
  createTypes,
  collections,
}: {
  createTypes: CreatableType[];
  collections: CollectionOption[];
}) {
  const { toggleMobile } = useSidebar();
  const { setOpen } = useSearch();
  const isMac = useSyncExternalStore(subscribe, getIsMac, getIsMacServer);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobile}
        aria-label="Open sidebar"
        className="md:hidden"
      >
        <Menu />
      </Button>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-80"
        aria-label="Go to dashboard"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-sm font-bold text-black">
          DS
        </span>
        <span className="text-base font-semibold tracking-tight">DevStash</span>
      </Link>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search items and collections"
        className="mx-auto flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent/50"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search items and collections...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className={isMac ? "text-xs" : undefined}>
            {isMac ? "⌘" : "Ctrl"}
          </span>
          <span>K</span>
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild aria-label="Favorites">
          <Link href="/favorites">
            <Star />
          </Link>
        </Button>
        <CreateCollectionDialog />
        <CreateItemDialog types={createTypes} collections={collections} />
      </div>
    </header>
  );
}
