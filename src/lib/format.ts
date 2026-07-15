// Shared display formatting helpers.

// Formats a date as "January 15, 2024".
export function formatFullDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Formats a date as "Jan 15, 2024" — a compact form for dense list rows.
export function formatShortDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
