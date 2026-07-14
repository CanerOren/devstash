// Pagination constants and pure helpers, shared by the paginated list pages
// (/items/[type], /collections, /collections/[id]) and the dashboard's
// fixed-size sections.

// How many items to show per page on any item list — the /items/[type] page and
// the item list inside a collection (/collections/[id]).
export const ITEMS_PER_PAGE = 21;

// How many collection cards to show per page on the /collections list.
export const COLLECTIONS_PER_PAGE = 21;

// How many collection cards the dashboard's Collections section shows.
export const DASHBOARD_COLLECTIONS_LIMIT = 6;

// How many items the dashboard's Recent section shows.
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

// Parses a raw `page` search-param value into a 1-based page number. Anything
// invalid (missing, non-numeric, non-integer, < 1) clamps to 1. The upper bound
// is enforced later by getPagination once the total count is known.
export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return 1;
  return n;
}

// The derived pagination state for a page of results.
export interface Pagination {
  page: number; // current page, clamped into [1, totalPages]
  perPage: number;
  totalCount: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  skip: number; // rows to skip for the current page (Prisma `skip`)
  take: number; // rows to take for the current page (Prisma `take`, == perPage)
}

// Given a requested page, total row count and page size, computes the derived
// pagination state. The page is clamped into [1, totalPages] so an out-of-range
// `?page=` never produces a negative skip or an empty page past the end. An
// empty result set still yields totalPages 1 (page 1), so callers can render a
// consistent empty state.
export function getPagination(
  requestedPage: number,
  totalCount: number,
  perPage: number,
): Pagination {
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  return {
    page,
    perPage,
    totalCount,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

// Builds the sequence of page numbers to render in the pagination control,
// inserting "ellipsis" markers where there are gaps. Always includes the first
// and last page plus a window of `siblings` pages on each side of the current
// page. E.g. current 5 of 10 with siblings 1 → [1, ellipsis, 4, 5, 6, ellipsis, 10].
export function pageSequence(
  current: number,
  totalPages: number,
  siblings = 1,
): (number | "ellipsis")[] {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let p = current - siblings; p <= current + siblings; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}
