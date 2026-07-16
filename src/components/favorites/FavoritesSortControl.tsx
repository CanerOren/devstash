"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortDirection } from "@/lib/favorites-sort";

// The per-section sort control: a field dropdown plus an asc/desc direction
// toggle. Purely presentational — the owning section holds the state.
export function FavoritesSortControl<F extends string>({
  fields,
  field,
  direction,
  onFieldChange,
  onDirectionToggle,
}: {
  fields: readonly { value: F; label: string }[];
  field: F;
  direction: SortDirection;
  onFieldChange: (field: F) => void;
  onDirectionToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Select value={field} onValueChange={(value) => onFieldChange(value as F)}>
        <SelectTrigger size="sm" className="w-[150px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fields.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-xs"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-8"
        onClick={onDirectionToggle}
        aria-label={
          direction === "asc" ? "Sorted ascending" : "Sorted descending"
        }
        title={direction === "asc" ? "Ascending" : "Descending"}
      >
        {direction === "asc" ? (
          <ArrowUp className="size-4" />
        ) : (
          <ArrowDown className="size-4" />
        )}
      </Button>
    </div>
  );
}
