import { FolderPlus, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Top bar for the dashboard shell.
// Phase 1: display only — the search and action buttons are not wired up yet.
export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <span className="text-base font-semibold tracking-tight">DevStash</span>

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
