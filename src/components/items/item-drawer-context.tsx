"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { DashboardItem } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";
import { setItemFavorite, setItemPin } from "@/actions/items";
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
  collections,
}: {
  children: React.ReactNode;
  // The user's collections, threaded down to the drawer's edit form.
  collections: CollectionOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardItem | null>(null);
  const [detail, setDetail] = useState<ItemDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoritePending, setFavoritePending] = useState(false);
  const [pinPending, setPinPending] = useState(false);

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

  // After a successful edit, replace the open drawer's detail with the fresh copy
  // and keep the summary's card-derived fields in sync (so the header stays
  // correct even before detail re-renders).
  const handleUpdated = useCallback((updated: ItemDetailResponse) => {
    setDetail(updated);
    setSummary((prev) =>
      prev && prev.id === updated.id
        ? {
            ...prev,
            title: updated.title,
            description: updated.description,
            tags: updated.tags,
            isFavorite: updated.isFavorite,
            isPinned: updated.isPinned,
          }
        : prev,
    );
  }, []);

  // After a successful delete, close the drawer. The card list is refreshed by
  // the drawer's router.refresh(), so the item disappears from the page.
  const handleDeleted = useCallback(() => {
    setOpen(false);
  }, []);

  // Toggles the open item's favorite flag. Updates both detail + summary
  // optimistically, calls the action, reverts (and toasts) on failure, then
  // refreshes so the underlying card lists reflect the new state.
  const handleToggleFavorite = useCallback(async () => {
    const id = detail?.id ?? summary?.id;
    if (!id || favoritePending) return;

    const next = !(detail?.isFavorite ?? summary?.isFavorite ?? false);
    setFavoritePending(true);
    setDetail((prev) =>
      prev && prev.id === id ? { ...prev, isFavorite: next } : prev,
    );
    setSummary((prev) =>
      prev && prev.id === id ? { ...prev, isFavorite: next } : prev,
    );

    const result = await setItemFavorite(id, next);
    setFavoritePending(false);

    if (!result.success) {
      // Revert the optimistic change.
      setDetail((prev) =>
        prev && prev.id === id ? { ...prev, isFavorite: !next } : prev,
      );
      setSummary((prev) =>
        prev && prev.id === id ? { ...prev, isFavorite: !next } : prev,
      );
      toast.error(result.error ?? "Failed to update favorite");
      return;
    }

    router.refresh();
  }, [detail, summary, favoritePending, router]);

  // Toggles the open item's pinned flag. Same optimistic pattern as favorite:
  // flip detail + summary, call the action, revert (and toast) on failure, then
  // refresh so the underlying listings re-sort (pinned items float to the top).
  const handleTogglePin = useCallback(async () => {
    const id = detail?.id ?? summary?.id;
    if (!id || pinPending) return;

    const next = !(detail?.isPinned ?? summary?.isPinned ?? false);
    setPinPending(true);
    setDetail((prev) =>
      prev && prev.id === id ? { ...prev, isPinned: next } : prev,
    );
    setSummary((prev) =>
      prev && prev.id === id ? { ...prev, isPinned: next } : prev,
    );

    const result = await setItemPin(id, next);
    setPinPending(false);

    if (!result.success) {
      // Revert the optimistic change.
      setDetail((prev) =>
        prev && prev.id === id ? { ...prev, isPinned: !next } : prev,
      );
      setSummary((prev) =>
        prev && prev.id === id ? { ...prev, isPinned: !next } : prev,
      );
      toast.error(result.error ?? "Failed to update pin");
      return;
    }

    router.refresh();
  }, [detail, summary, pinPending, router]);

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
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
        onToggleFavorite={handleToggleFavorite}
        favoritePending={favoritePending}
        onTogglePin={handleTogglePin}
        pinPending={pinPending}
        collections={collections}
      />
    </ItemDrawerContext.Provider>
  );
}
