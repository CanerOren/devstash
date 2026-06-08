import type { LucideIcon } from "lucide-react";

// A single dashboard stat tile (total items, collections, favorites, etc.).
// Presentational only — the value is computed by the caller.
export function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {/* Accent color is data-driven, so it must be inline. */}
        <span
          className="flex size-8 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icon className="size-4" style={{ color }} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
