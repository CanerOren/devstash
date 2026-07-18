"use client";

import { useState } from "react";
import Editor, {
  type EditorProps,
  type Monaco,
  type OnMount,
} from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { useEditorPreferences } from "@/components/editor/editor-preferences-context";
import type { EditorTheme } from "@/lib/editor-preferences";

// Fluid height: the editor grows with its content but never past MAX_HEIGHT
// (then it scrolls internally). MIN_HEIGHT keeps short snippets from collapsing.
const MIN_HEIGHT = 48;
const MAX_HEIGHT = 400;

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

// The three selectable themes (per the settings dropdown) mapped to their
// registered Monaco theme name. Each is defined in `defineThemes` below.
const MONACO_THEME_NAMES: Record<EditorTheme, string> = {
  "vs-dark": "devstash-vs-dark",
  monokai: "devstash-monokai",
  "github-dark": "devstash-github-dark",
};

// Each theme's editor surface color, used for the container background (so it
// matches while Monaco loads) and kept in sync with the `editor.background`
// values in defineThemes.
const THEME_SURFACE: Record<EditorTheme, string> = {
  "vs-dark": "#171717",
  monokai: "#272822",
  "github-dark": "#0d1117",
};

// Shared translucent-white scrollbar slider, which reads well on any dark
// surface (matches the app's other scroll areas).
const SCROLLBAR_COLORS = {
  "scrollbarSlider.background": "#ffffff20",
  "scrollbarSlider.hoverBackground": "#ffffff33",
  "scrollbarSlider.activeBackground": "#ffffff40",
} as const;

// Registers all three custom themes. Each is based on vs-dark (so any token not
// explicitly colored still gets a sensible dark-theme color) but overrides the
// surface + common token colors to match the named theme. Called in beforeMount.
function defineThemes(monaco: Monaco) {
  // vs-dark: the app-matched dark surface (neutral-900) with vs-dark token
  // colors, which read well on this background.
  monaco.editor.defineTheme(MONACO_THEME_NAMES["vs-dark"], {
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
      ...SCROLLBAR_COLORS,
    },
  });

  // Monokai: the classic warm-green/pink palette on #272822.
  monaco.editor.defineTheme(MONACO_THEME_NAMES.monokai, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "f8f8f2" },
      { token: "comment", foreground: "75715e", fontStyle: "italic" },
      { token: "string", foreground: "e6db74" },
      { token: "keyword", foreground: "f92672" },
      { token: "number", foreground: "ae81ff" },
      { token: "regexp", foreground: "e6db74" },
      { token: "type", foreground: "66d9ef", fontStyle: "italic" },
      { token: "type.identifier", foreground: "66d9ef", fontStyle: "italic" },
      { token: "operator", foreground: "f92672" },
      { token: "delimiter", foreground: "f8f8f2" },
      { token: "tag", foreground: "f92672" },
      { token: "attribute.name", foreground: "a6e22e" },
      { token: "attribute.value", foreground: "e6db74" },
    ],
    colors: {
      "editor.background": "#272822",
      "editorGutter.background": "#272822",
      "editor.foreground": "#f8f8f2",
      "editorLineNumber.foreground": "#90908a",
      "editorLineNumber.activeForeground": "#f8f8f2",
      "editor.lineHighlightBackground": "#3e3d32",
      "editor.lineHighlightBorder": "#00000000",
      "editorWidget.background": "#272822",
      "editorWidget.border": "#ffffff1a",
      ...SCROLLBAR_COLORS,
    },
  });

  // GitHub Dark: GitHub's dark palette on #0d1117.
  monaco.editor.defineTheme(MONACO_THEME_NAMES["github-dark"], {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "c9d1d9" },
      { token: "comment", foreground: "8b949e", fontStyle: "italic" },
      { token: "string", foreground: "a5d6ff" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "number", foreground: "79c0ff" },
      { token: "regexp", foreground: "7ee787" },
      { token: "type", foreground: "ffa657" },
      { token: "type.identifier", foreground: "ffa657" },
      { token: "operator", foreground: "ff7b72" },
      { token: "delimiter", foreground: "c9d1d9" },
      { token: "tag", foreground: "7ee787" },
      { token: "attribute.name", foreground: "79c0ff" },
      { token: "attribute.value", foreground: "a5d6ff" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editorGutter.background": "#0d1117",
      "editor.foreground": "#c9d1d9",
      "editorLineNumber.foreground": "#484f58",
      "editorLineNumber.activeForeground": "#c9d1d9",
      "editor.lineHighlightBackground": "#161b22",
      "editor.lineHighlightBorder": "#00000000",
      "editorWidget.background": "#0d1117",
      "editorWidget.border": "#ffffff1a",
      ...SCROLLBAR_COLORS,
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
  // Extra controls rendered in the header, between the language label and the
  // Copy button (e.g. the Explain button + Code/Explain tabs in the drawer read
  // view). Generic slot so this stays a plain editor with no AI dependency.
  headerActions?: React.ReactNode;
  // When non-null, rendered in place of the code body (same container). Monaco
  // stays mounted (just hidden) so toggling back doesn't remount or re-measure.
  bodyOverlay?: React.ReactNode;
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
  headerActions,
  bodyOverlay,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
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
    // From user preferences (settings › Editor Preferences).
    minimap: { enabled: preferences.minimap },
    fontSize: preferences.fontSize,
    lineHeight: Math.round(preferences.fontSize * 1.5),
    tabSize: preferences.tabSize,
    wordWrap: preferences.wordWrap ? "on" : "off",
    scrollBeyondLastLine: false,
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
    contextmenu: !readOnly,
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border",
        className,
      )}
      // Match the container to the active theme's surface so there's no
      // neutral-900 flash behind monokai / github-dark while Monaco loads.
      style={{ backgroundColor: THEME_SURFACE[preferences.theme] }}
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
          {headerActions}
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

      {/* Keep Monaco mounted (just hidden) when an overlay is shown, so toggling
          back to the code doesn't remount the editor or re-measure its height. */}
      <div style={bodyOverlay ? { display: "none" } : undefined}>
        <Editor
          value={value}
          language={toMonacoLanguage(language)}
          theme={MONACO_THEME_NAMES[preferences.theme]}
          height={height}
          beforeMount={defineThemes}
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
      {bodyOverlay}
    </div>
  );
}
