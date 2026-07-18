"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LANGUAGE_OPTIONS, languageLabelFor } from "@/lib/languages";

interface LanguageComboboxProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

// Searchable dropdown for picking a code language. Selecting an option sets the
// stored value; a value already stored but outside the curated list still shows
// (via languageLabelFor) so it round-trips. Selecting the current value again
// clears it back to none.
export function LanguageCombobox({ value, onChange, id }: LanguageComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = languageLabelFor(value);
  const current = value.trim().toLowerCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={selectedLabel ? "truncate" : "truncate text-muted-foreground"}>
            {selectedLabel || "Select language"}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {LANGUAGE_OPTIONS.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    // Toggle off if picking the already-selected language.
                    onChange(option.value === current ? "" : option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      option.value === current ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
