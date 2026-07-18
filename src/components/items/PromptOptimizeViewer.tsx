"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Crown, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useIsPro } from "@/components/ai/pro-context";
import { optimizePrompt } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";

interface PromptOptimizeViewerProps {
  // The current (saved) prompt content, shown on the Original tab.
  content: string;
  // Persists the accepted prompt. Resolves true on success. Owned by the drawer
  // (which also toasts + offers Undo). When absent, the accept action is hidden.
  onAccept?: (optimized: string) => Promise<boolean>;
}

type Tab = "original" | "optimized";

// Read-only prompt viewer (prompt items, drawer view) with an AI "Optimize"
// button in the Markdown editor header. Generating an optimized prompt reveals
// Original/Optimized tabs; the Optimized tab shows the refined prompt with
// Use/Discard actions. Accepting persists it (via onAccept) and replaces the
// item's content. Pro-only: free users see a Crown affordance with a tooltip
// (the server action enforces Pro too). Optimizations are not persisted until
// the user accepts.
export function PromptOptimizeViewer({
  content,
  onAccept,
}: PromptOptimizeViewerProps) {
  const isPro = useIsPro();
  const [tab, setTab] = useState<Tab>("original");
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [optimized, setOptimized] = useState<string | null>(null);

  async function handleOptimize() {
    if (loading) return;

    setLoading(true);
    const result = await optimizePrompt({ content });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Couldn't optimize this prompt.");
      return;
    }
    if (!result.data.prompt.trim()) {
      toast.info("Couldn't generate an improved prompt.");
      return;
    }

    setOptimized(result.data.prompt);
    setTab("optimized");
  }

  async function handleUse() {
    if (!optimized || !onAccept || accepting) return;

    setAccepting(true);
    const ok = await onAccept(optimized);
    setAccepting(false);

    if (ok) {
      // The item's content is now the optimized prompt; return to the (refreshed)
      // Original view.
      setOptimized(null);
      setTab("original");
    }
  }

  function handleDiscard() {
    setOptimized(null);
    setTab("original");
  }

  // Free users: a Crown affordance with a tooltip, matching the Explain button
  // (the server action still enforces Pro).
  const optimizeButton = isPro ? (
    <button
      type="button"
      onClick={handleOptimize}
      disabled={loading}
      title={optimized ? "Regenerate optimized prompt" : "Optimize this prompt"}
      aria-label={
        optimized ? "Regenerate optimized prompt" : "Optimize this prompt"
      }
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Sparkles className="size-3.5" />
      )}
      {loading ? "Optimizing…" : optimized ? "Regenerate" : "Optimize"}
    </button>
  ) : (
    <button
      type="button"
      onClick={() => toast.error("AI features require Pro subscription")}
      title="AI features require Pro subscription"
      aria-label="AI features require Pro subscription"
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
    >
      <Crown className="size-3.5" />
      Optimize
    </button>
  );

  const headerActions = (
    <div className="flex items-center gap-1">
      {optimized && (
        <div className="flex items-center gap-0.5">
          <TabButton
            active={tab === "original"}
            onClick={() => setTab("original")}
          >
            Original
          </TabButton>
          <TabButton
            active={tab === "optimized"}
            onClick={() => setTab("optimized")}
          >
            Optimized
          </TabButton>
        </div>
      )}
      {optimizeButton}
    </div>
  );

  const bodyOverlay =
    tab === "optimized" && optimized ? (
      <div>
        <div className="themed-scrollbar max-h-[400px] overflow-y-auto px-4 py-3">
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{optimized}</ReactMarkdown>
          </div>
        </div>
        {/* Accept / discard the optimized prompt. */}
        <div className="flex items-center gap-2 border-t border-border bg-white/[0.02] px-3 py-2">
          {onAccept && (
            <Button
              type="button"
              size="sm"
              onClick={handleUse}
              disabled={accepting}
            >
              {accepting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Use this prompt
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleDiscard}
            disabled={accepting}
          >
            <X className="size-4" />
            Discard
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <MarkdownEditor
      value={content}
      readOnly
      headerActions={headerActions}
      bodyOverlay={bodyOverlay}
    />
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-white/10 text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
