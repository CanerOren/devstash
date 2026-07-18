"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Crown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useIsPro } from "@/components/ai/pro-context";
import { explainCode } from "@/actions/ai";
import { CodeEditor } from "@/components/items/CodeEditor";

interface CodeExplainViewerProps {
  content: string;
  language?: string | null;
}

type Tab = "code" | "explain";

// Read-only code viewer (snippet/command, drawer view) with an AI "Explain"
// button in the editor header. Generating an explanation reveals Code/Explain
// tabs and renders the explanation as Markdown in the same container, in place
// of the code. Pro-only: free users see a Crown affordance with a tooltip
// (server actions enforce Pro too). Explanations are not persisted — each click
// of the Explain / Regenerate button calls the model afresh.
export function CodeExplainViewer({ content, language }: CodeExplainViewerProps) {
  const isPro = useIsPro();
  const [tab, setTab] = useState<Tab>("code");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  async function handleExplain() {
    if (loading) return;

    setLoading(true);
    const result = await explainCode({ content, language });
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Couldn't explain this code.");
      return;
    }
    if (!result.data.explanation.trim()) {
      toast.info("Couldn't generate an explanation for this code.");
      return;
    }

    setExplanation(result.data.explanation);
    setTab("explain");
  }

  // Free users: a Crown affordance with a tooltip, per spec (other AI features
  // hide entirely for free users — this one shows to advertise Pro).
  const explainButton = isPro ? (
    <button
      type="button"
      onClick={handleExplain}
      disabled={loading}
      title={explanation ? "Regenerate explanation" : "Explain this code"}
      aria-label={explanation ? "Regenerate explanation" : "Explain this code"}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Sparkles className="size-3.5" />
      )}
      {loading ? "Explaining…" : explanation ? "Regenerate" : "Explain"}
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
      Explain
    </button>
  );

  const headerActions = (
    <div className="flex items-center gap-1">
      {explanation && (
        <div className="flex items-center gap-0.5">
          <TabButton active={tab === "code"} onClick={() => setTab("code")}>
            Code
          </TabButton>
          <TabButton active={tab === "explain"} onClick={() => setTab("explain")}>
            Explain
          </TabButton>
        </div>
      )}
      {explainButton}
    </div>
  );

  const bodyOverlay =
    tab === "explain" && explanation ? (
      <div className="themed-scrollbar max-h-[400px] overflow-y-auto px-4 py-3">
        <div className="markdown-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
        </div>
      </div>
    ) : null;

  return (
    <CodeEditor
      value={content}
      language={language}
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
