"use client";

import { cn } from "@/lib/utils";
import { SidebarContent } from "@/components/dashboard/SidebarContent";
import { useSidebar } from "@/components/dashboard/sidebar-context";

// Dashboard sidebar. On desktop (md+) it's a column that collapses to a narrow
// icon rail; on mobile it's an overlay drawer. Both share SidebarContent.
export function Sidebar() {
  const { mobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Desktop column — width is driven by SidebarContent (rail vs full) */}
      <aside className="hidden shrink-0 border-r border-sidebar-border md:block">
        <SidebarContent variant="desktop" />
      </aside>

      {/* Mobile backdrop */}
      <div
        onClick={closeMobile}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 border-r border-sidebar-border transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent variant="mobile" />
      </aside>
    </>
  );
}
