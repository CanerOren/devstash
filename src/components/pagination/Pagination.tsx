import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { pageSequence } from "@/lib/pagination";

interface PaginationProps {
  page: number; // current page (1-based)
  totalPages: number;
  // Base path for the list, e.g. "/items/snippets". Page N links to
  // `${basePath}?page=N`, with page 1 keeping the clean base path.
  basePath: string;
}

// Builds the href for a given page — page 1 keeps the clean URL (no ?page=1).
function hrefFor(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

const baseCell =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border px-3 text-sm transition-colors";

// Server-rendered pagination control: prev / numbered pages / next. Prev and
// next are greyed-out, non-interactive spans at the ends. Renders nothing when
// there's only a single page.
export function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const sequence = pageSequence(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {/* Previous */}
      {page > 1 ? (
        <Link
          href={hrefFor(basePath, page - 1)}
          rel="prev"
          className={cn(baseCell, "hover:bg-accent")}
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only sm:not-sr-only">Prev</span>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(baseCell, "cursor-not-allowed text-muted-foreground/50")}
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only sm:not-sr-only">Prev</span>
        </span>
      )}

      {/* Page numbers */}
      {sequence.map((entry, i) =>
        entry === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex h-9 min-w-9 items-center justify-center text-sm text-muted-foreground"
          >
            &hellip;
          </span>
        ) : entry === page ? (
          <span
            key={entry}
            aria-current="page"
            className={cn(
              baseCell,
              "border-transparent bg-primary font-medium text-primary-foreground",
            )}
          >
            {entry}
          </span>
        ) : (
          <Link
            key={entry}
            href={hrefFor(basePath, entry)}
            className={cn(baseCell, "hover:bg-accent")}
          >
            {entry}
          </Link>
        ),
      )}

      {/* Next */}
      {page < totalPages ? (
        <Link
          href={hrefFor(basePath, page + 1)}
          rel="next"
          className={cn(baseCell, "hover:bg-accent")}
        >
          <span className="sr-only sm:not-sr-only">Next</span>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(baseCell, "cursor-not-allowed text-muted-foreground/50")}
        >
          <span className="sr-only sm:not-sr-only">Next</span>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
