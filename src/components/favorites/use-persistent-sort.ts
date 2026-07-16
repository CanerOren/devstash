"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { SortDirection, SortPreference } from "@/lib/favorites-sort";

// A localStorage-backed sort preference. Uses useSyncExternalStore so the server
// (and the hydrating client) render the fallback, then correct to the stored
// value after hydration — no mismatch, and no setState-in-effect. The snapshot
// is the raw "field:direction" string (stable by identity), parsed via useMemo.

const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // Reflect changes made in other tabs; same-tab writes notify manually.
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

const serverSnapshot = (): string | null => null;

function parse<F extends string>(
  raw: string | null,
  allowedFields: readonly F[],
  fallback: SortPreference<F>,
): SortPreference<F> {
  if (!raw) return fallback;
  const [field, direction] = raw.split(":");
  if (
    allowedFields.includes(field as F) &&
    (direction === "asc" || direction === "desc")
  ) {
    return { field: field as F, direction: direction as SortDirection };
  }
  return fallback;
}

export function usePersistentSort<F extends string>(
  key: string,
  allowedFields: readonly F[],
  fallback: SortPreference<F>,
): [SortPreference<F>, (next: SortPreference<F>) => void] {
  const getSnapshot = useCallback((): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);

  const preference = useMemo(
    () => parse(raw, allowedFields, fallback),
    [raw, allowedFields, fallback],
  );

  const setPreference = useCallback(
    (next: SortPreference<F>) => {
      try {
        window.localStorage.setItem(key, `${next.field}:${next.direction}`);
      } catch {
        // Ignore write failures (private mode, quota); state stays in memory.
      }
      listeners.forEach((listener) => listener());
    },
    [key],
  );

  return [preference, setPreference];
}
