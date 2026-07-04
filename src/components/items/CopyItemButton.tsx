"use client";

import { useState, type MouseEvent } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import type { DashboardItem } from "@/lib/db/items";
import { cn } from "@/lib/utils";

// Types whose content (or link URL) can be copied. File/image items have no
// copyable text, so the button is hidden for them.
const COPYABLE_TYPES = new Set(["snippet", "prompt", "command", "note", "link"]);

// A small hover-revealed copy button for item cards. The card view-model doesn't
// carry the item's content, so this fetches the full detail on click (same
// on-demand route the drawer uses) and copies `content ?? url`.
export function CopyItemButton({
  item,
  className,
}: {
  item: DashboardItem;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!COPYABLE_TYPES.has(item.type.name)) return null;

  async function handleCopy(e: MouseEvent) {
    // Don't let the click bubble to the card's open-drawer overlay.
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${item.id}`);
      const json = await res.json();
      const text: string = json?.data?.content ?? json?.data?.url ?? "";
      if (!text) {
        toast.error("Nothing to copy");
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy item"
      title={copied ? "Copied" : "Copy"}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        // Always visible on mobile (no hover); reveal on hover from sm up.
        "opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
        className,
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
