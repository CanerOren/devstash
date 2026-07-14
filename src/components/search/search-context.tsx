"use client";

import { createContext, useContext, useEffect, useState } from "react";

import type { SearchData } from "@/lib/db/search";

interface SearchContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  data: SearchData;
}

const SearchContext = createContext<SearchContextValue | null>(null);

// Hook for the top bar (to open the palette) and the palette itself (to read the
// pre-fetched dataset + open state). Throws if used outside the provider.
export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

// Owns the command palette's open state and the global Cmd/Ctrl+K shortcut, and
// holds the pre-fetched searchable dataset. Wraps the whole app shell so the top
// bar (which opens it) and the palette (rendered deeper, inside the item-drawer
// provider so it can open items) share one open state.
export function SearchProvider({
  data,
  children,
}: {
  data: SearchData;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Cmd+K (Mac) / Ctrl+K (Windows/Linux) toggles the palette.
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SearchContext.Provider value={{ open, setOpen, data }}>
      {children}
    </SearchContext.Provider>
  );
}
