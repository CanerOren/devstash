"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useIsPro } from "@/components/ai/pro-context";
import { generateAutoTags } from "@/actions/ai";

interface TagSuggestionsProps {
  title: string;
  content: string;
  language: string;
  // Current tags (any case), so already-present suggestions are filtered out.
  existingTags: string[];
  // Called when the user accepts a suggestion — appends it to the tag list.
  onAdd: (tag: string) => void;
}

// "Suggest Tags" button + accept/reject suggestion chips, shown near the tags
// input. AI is Pro-only, so the whole control is hidden for free users (server
// actions enforce Pro too). Accepted tags flow into the form's normal tags
// field and persist through the existing create/update path — no new write.
export function TagSuggestions({
  title,
  content,
  language,
  existingTags,
  onAdd,
}: TagSuggestionsProps) {
  const isPro = useIsPro();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // UI gating: free users never see the AI affordance.
  if (!isPro) return null;

  async function handleSuggest() {
    if (!title.trim()) {
      toast.error("Add a title first to suggest tags.");
      return;
    }

    setLoading(true);
    const result = await generateAutoTags({ title, content, language });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Couldn't generate tags.");
      return;
    }

    // Drop suggestions the item already has (case-insensitive).
    const have = new Set(existingTags.map((t) => t.toLowerCase()));
    const fresh = result.data.tags.filter((tag) => !have.has(tag.toLowerCase()));

    if (fresh.length === 0) {
      toast.info("No new tag suggestions.");
      setSuggestions([]);
      return;
    }
    setSuggestions(fresh);
  }

  function accept(tag: string) {
    onAdd(tag);
    setSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  function reject(tag: string) {
    setSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleSuggest}
        disabled={loading}
        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        {loading ? "Suggesting..." : "Suggest Tags"}
      </Button>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-border py-0.5 pr-0.5 pl-2 text-xs"
            >
              <span className="text-muted-foreground">{tag}</span>
              <button
                type="button"
                onClick={() => accept(tag)}
                aria-label={`Add tag ${tag}`}
                className="flex size-4 items-center justify-center rounded text-emerald-500 hover:bg-accent"
              >
                <Check className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => reject(tag)}
                aria-label={`Dismiss tag ${tag}`}
                className="flex size-4 items-center justify-center rounded text-muted-foreground hover:bg-accent"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
