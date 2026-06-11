// Shared helpers for the db fetchers.

// No auth yet — the dashboard reads the seeded demo user's data. Once NextAuth
// is wired up this gets replaced by the session user's id (a single seam here).
export const DEMO_USER_EMAIL = "demo@devstash.io";

// Capitalize a raw type name for display, e.g. "snippet" → "Snippet".
export function toLabel(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
