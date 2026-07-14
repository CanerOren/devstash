"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { CreateCollectionDialog } from "@/components/items/CreateCollectionDialog";
import type { CreatableType } from "@/lib/db/items";

// Top bar for the dashboard shell.
// The search box is display-only; the menu button opens the sidebar drawer on
// mobile (desktop collapse lives inside the sidebar). The New Collection and New
// Item buttons open their respective create modals.
export function TopBar({ createTypes }: { createTypes: CreatableType[] }) {
  const { toggleMobile } = useSidebar();

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

      <div className="relative mx-auto w-full max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items..."
          className="pl-9"
          disabled
          aria-label="Search items"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <CreateCollectionDialog />
        <CreateItemDialog types={createTypes} />
      </div>
    </header>
  );
}
