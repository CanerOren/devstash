"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Folder,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Star,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { collections, currentUser, itemTypes } from "@/lib/mock-data";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { useSidebar } from "@/components/dashboard/sidebar-context";

// A collapsible section with a header that toggles its body open/closed.
// Only used in the full (expanded) sidebar — the rail renders flat icon rows.
function NavGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground"
      >
        {title}
        <ChevronDown
          className={cn("size-3.5 transition-transform", !open && "-rotate-90")}
        />
      </button>
      <div className="mt-1 space-y-0.5">{open && children}</div>
    </div>
  );
}

// Base styling for sidebar navigation rows; centers the icon when in rail mode.
function rowClass(isRail: boolean) {
  return cn(
    "flex items-center gap-2.5 rounded-md py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    isRail ? "justify-center px-0" : "px-2",
  );
}

// The inner content of the sidebar — shared by the desktop column and the
// mobile drawer. Renders a narrow icon rail when collapsed on desktop.
export function SidebarContent({
  variant,
}: {
  variant: "desktop" | "mobile";
}) {
  const { collapsed, toggleCollapsed, closeMobile } = useSidebar();
  const isRail = variant === "desktop" && collapsed;

  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const recentCollections = collections.filter((c) => !c.isFavorite);

  const typeRow = (type: (typeof itemTypes)[number]) => {
    const Icon = getTypeIcon(type.icon);
    return (
      <Link
        key={type.id}
        href={`/items/${type.label.toLowerCase()}`}
        onClick={closeMobile}
        title={isRail ? type.label : undefined}
        className={rowClass(isRail)}
      >
        {/* Color is data-driven (ItemType.color), so it must be inline. */}
        <Icon className="size-4 shrink-0" style={{ color: type.color }} />
        {!isRail && (
          <>
            <span className="flex-1 truncate">{type.label}</span>
            <span className="text-xs text-muted-foreground">{type.count}</span>
          </>
        )}
      </Link>
    );
  };

  const collectionRow = (
    col: (typeof collections)[number],
    favorite: boolean,
  ) => (
    <Link
      key={col.id}
      href={`/collections/${col.id}`}
      onClick={closeMobile}
      title={isRail ? col.name : undefined}
      className={rowClass(isRail)}
    >
      {favorite ? (
        <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" />
      ) : (
        <Folder className="size-4 shrink-0 text-muted-foreground" />
      )}
      {!isRail && (
        <>
          <span className="flex-1 truncate">{col.name}</span>
          <span className="text-xs text-muted-foreground">{col.itemCount}</span>
        </>
      )}
    </Link>
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        isRail ? "w-16" : "w-64",
      )}
    >
      {/* Header — collapse toggle (desktop) or close (mobile) */}
      <div
        className={cn(
          "flex h-12 shrink-0 items-center border-b border-sidebar-border",
          isRail ? "justify-center px-0" : "justify-between px-2 pl-3",
        )}
      >
        {!isRail && (
          <span className="text-sm font-semibold tracking-tight">Navigation</span>
        )}
        {variant === "desktop" ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobile}
            aria-label="Close sidebar"
          >
            <X />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {isRail ? (
          // Rail: flat, icon-only rows with a divider between types and collections.
          <>
            {itemTypes.map(typeRow)}
            <div className="my-2 border-t border-sidebar-border" />
            {favoriteCollections.map((col) => collectionRow(col, true))}
            {recentCollections.map((col) => collectionRow(col, false))}
          </>
        ) : (
          <>
            <NavGroup title="Types">{itemTypes.map(typeRow)}</NavGroup>

            <NavGroup title="Collections">
              {favoriteCollections.length > 0 && (
                <>
                  <p className="px-2 pt-1 pb-0.5 text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">
                    Favorites
                  </p>
                  {favoriteCollections.map((col) => collectionRow(col, true))}
                </>
              )}
              {recentCollections.length > 0 && (
                <>
                  <p className="px-2 pt-2 pb-0.5 text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">
                    Recent
                  </p>
                  {recentCollections.map((col) => collectionRow(col, false))}
                </>
              )}
            </NavGroup>
          </>
        )}
      </nav>

      {/* User area */}
      <div
        className={cn(
          "flex items-center border-t border-sidebar-border p-3",
          isRail ? "justify-center" : "gap-3",
        )}
      >
        <Link
          href="/settings"
          onClick={closeMobile}
          title={isRail ? currentUser.name : undefined}
          aria-label={isRail ? "Settings" : undefined}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground"
        >
          {currentUser.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </Link>
        {!isRail && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{currentUser.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {currentUser.email}
              </p>
            </div>
            <Link
              href="/settings"
              onClick={closeMobile}
              aria-label="Settings"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="size-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
