"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useIsPro } from "@/components/ai/pro-context";
import { generateDescription } from "@/actions/ai";

interface DescriptionSuggestionProps {
  typeName: string;
  title: string;
  content: string;
  url: string;
  language: string;
  // The current description value, captured as the "before" state for Undo.
  current: string;
  // Replaces the description field with the generated text.
  onChange: (next: string) => void;
}

// "Generate" icon button shown next to the Description label. AI is Pro-only, so
// the whole control is hidden for free users (the server action enforces Pro
// too). On click it summarizes the current (unsaved) form state and overwrites
// the description, offering an Undo toast to restore the previous text.
export function DescriptionSuggestion({
  typeName,
  title,
  content,
  url,
  language,
  current,
  onChange,
}: DescriptionSuggestionProps) {
  const isPro = useIsPro();
  const [loading, setLoading] = useState(false);

  // UI gating: free users never see the AI affordance.
  if (!isPro) return null;

  async function handleGenerate() {
    if (!title.trim()) {
      toast.error("Add a title first to generate a description.");
      return;
    }

    // Snapshot the current text so Undo can restore it after the overwrite.
    const previous = current;

    setLoading(true);
    const result = await generateDescription({
      typeName,
      title,
      content,
      url,
      language,
    });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Couldn't generate a description.");
      return;
    }

    const next = result.data.description;
    if (!next) {
      toast.info("Couldn't generate a description. Try adding more detail.");
      return;
    }

    onChange(next);
    toast.success("Description generated", {
      // Give a generous window to undo the overwrite before the toast dismisses.
      duration: 10000,
      action: {
        label: "Undo",
        onClick: () => onChange(previous),
      },
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleGenerate}
      disabled={loading}
      aria-label="Generate description"
      className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Sparkles className="size-3.5" />
      )}
      {loading ? "Generating..." : "Generate description"}
    </Button>
  );
}
