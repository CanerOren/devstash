"use client";

import { FolderPlus, Menu, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/dashboard/sidebar-context";

// Top bar for the dashboard shell.
// The search and action buttons are display-only; the menu button opens the
// sidebar drawer on mobile (desktop collapse lives inside the sidebar itself).
export function TopBar() {
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
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-sm font-bold text-black">
          DS
        </span>
        <span className="text-base font-semibold tracking-tight">DevStash</span>
      </div>

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
        <Button variant="outline" size="sm" disabled>
          <FolderPlus />
          New Collection
        </Button>
        <Button size="sm" disabled>
          <Plus />
          New Item
        </Button>
      </div>
    </header>
  );
}
