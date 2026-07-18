// Curated list of languages for the item Language dropdown. The `value` is what
// gets stored on `Item.language` (free text) and later handed to the code editor,
// which normalizes it to a Monaco language id (see `toMonacoLanguage` in
// CodeEditor). Values are lowercase canonical ids that Monaco understands
// directly; `label` is the display name shown in the dropdown.
//
// This is the single source of truth for the dropdown. A value stored on an
// existing item that isn't in this list still round-trips: `languageLabelFor`
// falls back to the raw value so it displays and re-saves unchanged.

export interface LanguageOption {
  value: string;
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "tsx", label: "TSX" },
  { value: "jsx", label: "JSX" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "dart", label: "Dart" },
  { value: "scala", label: "Scala" },
  { value: "lua", label: "Lua" },
  { value: "r", label: "R" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "sql", label: "SQL" },
  { value: "graphql", label: "GraphQL" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "toml", label: "TOML" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "powershell", label: "PowerShell" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "plaintext", label: "Plain text" },
];

const LABEL_BY_VALUE = new Map(
  LANGUAGE_OPTIONS.map((option) => [option.value, option.label]),
);

// Display label for a stored language value. Known values map to their curated
// label; an unknown-but-present value (e.g. a legacy free-text entry) is shown
// verbatim so it still round-trips; empty/null returns "".
export function languageLabelFor(value: string | null | undefined): string {
  const raw = value?.trim();
  if (!raw) return "";
  return LABEL_BY_VALUE.get(raw.toLowerCase()) ?? raw;
}
