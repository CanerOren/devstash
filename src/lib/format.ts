// Shared display formatting helpers.

// Formats a date as "January 15, 2024".
export function formatFullDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
