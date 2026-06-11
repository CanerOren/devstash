"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Star,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SidebarItemType } from "@/lib/db/items";
import type { SidebarCollection } from "@/lib/db/collections";
import type { SidebarUser } from "@/lib/db/user";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { useSidebar } from "@/components/dashboard/sidebar-context";

// Initials for the avatar, derived from the user's name (or email as fallback).
function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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
  itemTypes,
  collections,
  user,
}: {
  variant: "desktop" | "mobile";
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
  user: SidebarUser;
}) {
  const { collapsed, toggleCollapsed, closeMobile } = useSidebar();
  const isRail = variant === "desktop" && collapsed;

  // Name is optional in the DB, so fall back to the email for display.
  const displayName = user.name ?? user.email;

  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const recentCollections = collections.filter((c) => !c.isFavorite);

  const typeRow = (type: SidebarItemType) => {
    const Icon = getTypeIcon(type.icon);
    // File and Image are Pro-only types (see project overview's type table).
    const isPro = type.name === "file" || type.name === "image";
    return (
      <Link
        key={type.id}
        href={type.href}
        onClick={closeMobile}
        title={isRail ? type.label : undefined}
        className={rowClass(isRail)}
      >
        {/* Color is data-driven (ItemType.color), so it must be inline. */}
        <Icon className="size-4 shrink-0" style={{ color: type.color }} />
        {!isRail && (
          <>
            <span className="flex-1 truncate">{type.label}</span>
            {isPro && (
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[0.6rem] font-semibold tracking-wider text-muted-foreground"
              >
                PRO
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{type.count}</span>
          </>
        )}
      </Link>
    );
  };

  const collectionRow = (col: SidebarCollection, favorite: boolean) => (
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
        // Recent collections show a circle in their most-used type's color.
        <span
          aria-hidden
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: col.primaryColor }}
        />
      )}
      {!isRail && (
        <>
          <span className="flex-1 truncate">{col.name}</span>
          <span className="text-xs text-muted-foreground">{col.itemCount}</span>
        </>
      )}
    </Link>
  );

  // "View all collections" link shown under the collections list.
  const viewAllCollections = (
    <Link
      href="/collections"
      onClick={closeMobile}
      title={isRail ? "View all collections" : undefined}
      className={cn(rowClass(isRail), "text-muted-foreground")}
    >
      <LayoutGrid className="size-4 shrink-0" />
      {!isRail && <span className="flex-1 truncate">View all collections</span>}
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
            {viewAllCollections}
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
              <div className="mt-1">{viewAllCollections}</div>
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
          title={isRail ? displayName : undefined}
          aria-label={isRail ? "Settings" : undefined}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground"
        >
          {initialsOf(displayName)}
        </Link>
        {!isRail && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
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
