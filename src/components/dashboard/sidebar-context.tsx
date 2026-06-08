"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface SidebarContextValue {
  collapsed: boolean; // desktop: sidebar collapsed to a narrow icon rail
  toggleCollapsed: () => void; // desktop: toggle rail/expanded
  mobileOpen: boolean; // mobile: drawer overlay open
  toggleMobile: () => void; // mobile: open/close the drawer overlay
  closeMobile: () => void; // mobile: close the drawer (e.g. after navigating)
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);
  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggleCollapsed, mobileOpen, toggleMobile, closeMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}
