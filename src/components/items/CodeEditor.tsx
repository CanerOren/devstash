"use client";

import { useState } from "react";
import Editor, {
  type EditorProps,
  type Monaco,
  type OnMount,
} from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

// Fluid height: the editor grows with its content but never past MAX_HEIGHT
// (then it scrolls internally). MIN_HEIGHT keeps short snippets from collapsing.
const MIN_HEIGHT = 48;
const MAX_HEIGHT = 400;

const MONACO_THEME = "devstash-dark";

// Maps the stored `language` value (free text, e.g. "bash") onto a Monaco
// language id. Unknown / empty languages fall back to plain text.
const LANGUAGE_ALIASES: Record<string, string> = {
  bash: "shell",
  sh: "shell",
  zsh: "shell",
  shell: "shell",
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  golang: "go",
};

function toMonacoLanguage(language?: string | null): string {
  const raw = language?.trim().toLowerCase();
  if (!raw) return "plaintext";
  return LANGUAGE_ALIASES[raw] ?? raw;
}

// The label shown in the header — the raw language, or "plain text" when unset.
function languageLabel(language?: string | null): string {
  const raw = language?.trim();
  return raw && raw.length > 0 ? raw : "plain text";
}

// Defines a dark Monaco theme whose surface, gutter, line highlight, and
// scrollbar match the app's dark palette (see globals.css). Token colors inherit
// from vs-dark, which reads well on this background.
function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme(MONACO_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#171717", // card / neutral-900
      "editorGutter.background": "#171717",
      "editorLineNumber.foreground": "#525252", // neutral-600
      "editorLineNumber.activeForeground": "#a3a3a3", // neutral-400
      "editor.lineHighlightBackground": "#262626", // muted / neutral-800
      "editor.lineHighlightBorder": "#00000000",
      "editorWidget.background": "#171717",
      "editorWidget.border": "#ffffff1a",
      "scrollbarSlider.background": "#ffffff20",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff40",
    },
  });
}

interface CodeEditorProps {
  value: string;
  language?: string | null;
  // Omit (or pass readOnly) to render a read-only viewer; pass onChange to edit.
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

// A Monaco-based code editor with a macOS-style window header (traffic-light
// dots, language label, copy button). Used for snippet/command items in both
// read-only display and inline edit modes. Height is fluid up to MAX_HEIGHT.
export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  className,
}: CodeEditorProps) {
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [copied, setCopied] = useState(false);

  const handleMount: OnMount = (editorInstance) => {
    const applyHeight = () => {
      const contentHeight = editorInstance.getContentHeight();
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight)));
    };
    editorInstance.onDidContentSizeChange(applyHeight);
    applyHeight();
  };

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

  const options: NonNullable<EditorProps["options"]> = {
    readOnly,
    domReadOnly: readOnly,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
    fontLigatures: false,
    padding: { top: 12, bottom: 12 },
    lineNumbers: "on",
    lineNumbersMinChars: 3,
    glyphMargin: false,
    folding: false,
    renderLineHighlight: readOnly ? "none" : "line",
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      alwaysConsumeMouseWheel: false,
    },
    automaticLayout: true,
    tabSize: 2,
    wordWrap: "off",
    contextmenu: !readOnly,
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-[#171717]",
        className,
      )}
    >
      {/* macOS-style window header */}
      <div className="flex items-center gap-2 border-b border-border bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {languageLabel(language)}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!value}
            title={copied ? "Copied" : "Copy"}
            aria-label={copied ? "Copied" : "Copy"}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <Editor
        value={value}
        language={toMonacoLanguage(language)}
        theme={MONACO_THEME}
        height={height}
        beforeMount={defineTheme}
        onMount={handleMount}
        onChange={(next) => onChange?.(next ?? "")}
        options={options}
        loading={
          <div className="flex h-12 items-center px-4 text-xs text-muted-foreground">
            Loading editor…
          </div>
        }
      />
    </div>
  );
}
