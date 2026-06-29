"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

import type { DashboardItem } from "@/lib/db/items";
import {
  ItemDrawer,
  type ItemDetailResponse,
} from "@/components/items/ItemDrawer";

interface ItemDrawerContextValue {
  // Opens the drawer for an item card and fetches its full detail.
  openItem: (item: DashboardItem) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

// Hook for cards to open the item drawer. Throws if used outside the provider.
export function useItemDrawer(): ItemDrawerContextValue {
  const context = useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return context;
}

// Client wrapper that owns the item drawer's open/selected/fetch state, so the
// server-rendered pages can stay server components and just drop <ItemCard>s
// inside. Card data is already on the page; full detail is fetched on click.
export function ItemDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardItem | null>(null);
  const [detail, setDetail] = useState<ItemDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks the latest opened item so a slow earlier fetch can't overwrite the
  // detail of an item the user opened afterwards.
  const currentId = useRef<string | null>(null);

  const openItem = useCallback((item: DashboardItem) => {
    currentId.current = item.id;
    setSummary(item);
    setDetail(null);
    setError(null);
    setLoading(true);
    setOpen(true);

    fetch(`/api/items/${item.id}`)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.success) {
          throw new Error(body?.error ?? "Failed to load item");
        }
        return body.data as ItemDetailResponse;
      })
      .then((data) => {
        if (currentId.current !== item.id) return; // a newer item was opened
        setDetail(data);
      })
      .catch((err: unknown) => {
        if (currentId.current !== item.id) return;
        setError(err instanceof Error ? err.message : "Failed to load item");
      })
      .finally(() => {
        if (currentId.current === item.id) setLoading(false);
      });
  }, []);

  return (
    <ItemDrawerContext.Provider value={{ openItem }}>
      {children}
      <ItemDrawer
        open={open}
        onOpenChange={setOpen}
        summary={summary}
        detail={detail}
        loading={loading}
        error={error}
      />
    </ItemDrawerContext.Provider>
  );
}
