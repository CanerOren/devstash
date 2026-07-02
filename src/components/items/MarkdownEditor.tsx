"use client";

import { useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

// Fluid height: the Write textarea grows with its content but never past
// MAX_HEIGHT (then it scrolls internally), mirroring CodeEditor's behavior.
// MIN_HEIGHT keeps short notes from collapsing.
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 400;

type Tab = "write" | "preview";

interface MarkdownEditorProps {
  value: string;
  // Omit (or pass readOnly) to render a read-only preview; pass onChange to edit.
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

// A Markdown editor with Write/Preview tabs and a copy button, styled to match
// the app's dark surface. Used for note/prompt items in both read-only display
// (Preview only) and inline edit (Write default, Preview available) modes.
// Markdown is rendered with GitHub Flavored Markdown via the `.markdown-preview`
// CSS class in globals.css.
export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<Tab>(readOnly ? "preview" : "write");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the Write textarea up to MAX_HEIGHT, then let it scroll internally.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el || readOnly || tab !== "write") return;
    el.style.height = "auto";
    el.style.height = `${Math.min(
      MAX_HEIGHT,
      Math.max(MIN_HEIGHT, el.scrollHeight),
    )}px`;
  }, [value, tab, readOnly]);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context) — fail silently.
    }
  }

  const showWrite = !readOnly && tab === "write";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[#1e1e1e]",
        className,
      )}
    >
      {/* Header: Write/Preview tabs (edit mode) or a Preview label (readonly),
          plus a copy button matching CodeEditor's. */}
      <div className="flex items-center gap-2 border-b border-border bg-[#2d2d2d] px-2 py-1.5">
        {readOnly ? (
          <span className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Preview
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <TabButton active={tab === "write"} onClick={() => setTab("write")}>
              Write
            </TabButton>
            <TabButton
              active={tab === "preview"}
              onClick={() => setTab("preview")}
            >
              Preview
            </TabButton>
          </div>
        )}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value}
          title={copied ? "Copied" : "Copy"}
          aria-label={copied ? "Copied" : "Copy"}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Body */}
      {showWrite ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Write Markdown…"
          spellCheck={false}
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
          className="themed-scrollbar block w-full resize-none bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
        />
      ) : (
        <div
          className="themed-scrollbar max-h-[400px] overflow-y-auto px-4 py-3"
          style={readOnly ? undefined : { minHeight: MIN_HEIGHT }}
        >
          {value.trim() ? (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
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
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-white/10 text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
