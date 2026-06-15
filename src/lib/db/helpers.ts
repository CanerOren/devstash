// Shared helpers for the db fetchers.

import { cache } from "react";
import { auth } from "@/auth";

// Resolves the authenticated user's id from the NextAuth session. The dashboard
// fetchers all scope their queries to this id. Only called from auth-gated
// routes, so a session is expected — throw if it's somehow missing.
//
// Wrapped in React's `cache()` so the underlying `auth()` (JWT decode) runs at
// most once per request even though many fetchers call this in parallel.
export const requireUserId = cache(async (): Promise<string> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("requireUserId called without an authenticated session");
  }
  return userId;
});

// Capitalize a raw type name for display, e.g. "snippet" → "Snippet".
export function toLabel(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
