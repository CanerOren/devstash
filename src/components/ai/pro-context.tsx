"use client";

import { createContext, useContext } from "react";

// Lightweight client context carrying the signed-in user's Pro status, so
// deeply-nested UI (e.g. the Suggest Tags button inside ItemEditForm) can hide
// Pro-only affordances without prop-drilling through every dialog/form. This is
// UI gating only — server actions enforce Pro server-side.
const ProContext = createContext(false);

export function ProProvider({
  isPro,
  children,
}: {
  isPro: boolean;
  children: React.ReactNode;
}) {
  return <ProContext.Provider value={isPro}>{children}</ProContext.Provider>;
}

export function useIsPro(): boolean {
  return useContext(ProContext);
}
