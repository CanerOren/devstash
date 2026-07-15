import { z } from "zod";

// ─── Editor preferences ──────────────────────────────────────────────────────
// The user's Monaco code-editor preferences, persisted as a JSON column on the
// User model (`editorPreferences`) and applied to the CodeEditor component.
//
// This module is the single source of truth for the shape, the allowed option
// values, the defaults, and the validation. Both the server action (strict,
// rejects bad input) and the read path (tolerant, fills defaults for
// null/partial/legacy JSON) build on the schema here.

// Curated options offered by the settings dropdowns. The Zod schema below
// validates a slightly wider range so a stored value just outside the list (or
// a future option) still round-trips instead of being discarded.
export const FONT_SIZE_OPTIONS = [12, 13, 14, 15, 16, 18] as const;
export const TAB_SIZE_OPTIONS = [2, 4, 8] as const;

export const EDITOR_THEMES = [
  { value: "vs-dark", label: "VS Dark" },
  { value: "monokai", label: "Monokai" },
  { value: "github-dark", label: "GitHub Dark" },
] as const;

export type EditorTheme = (typeof EDITOR_THEMES)[number]["value"];

export interface EditorPreferences {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  theme: EditorTheme;
}

// Defaults per the spec: word wrap on, minimap off, theme vs-dark. Font/tab
// sizes match what CodeEditor previously hard-coded (13px, 2 spaces).
export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

// Strict schema for a full preferences object — used to validate updates coming
// from the client. Numeric fields accept a sensible range (wider than the
// curated dropdown options) rather than an exact enum, so the UI can add options
// later without a schema change.
export const editorPreferencesSchema = z.object({
  fontSize: z.number().int().min(8).max(40),
  tabSize: z.number().int().min(1).max(8),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(["vs-dark", "monokai", "github-dark"]),
});

// Coerces an untrusted value (the raw JSON column, which may be null, partial,
// or legacy) into a complete EditorPreferences, filling any missing or invalid
// field from the defaults. Never throws — a bad field falls back individually
// so one stray value can't wipe the others.
export function normalizeEditorPreferences(raw: unknown): EditorPreferences {
  const parsed = editorPreferencesSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return { ...DEFAULT_EDITOR_PREFERENCES };
  }
  return { ...DEFAULT_EDITOR_PREFERENCES, ...parsed.data };
}
