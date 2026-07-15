import { describe, it, expect } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  normalizeEditorPreferences,
} from "@/lib/editor-preferences";

describe("normalizeEditorPreferences", () => {
  it("returns the defaults for null (the empty column)", () => {
    expect(normalizeEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns the defaults for a non-object value", () => {
    expect(normalizeEditorPreferences("nonsense")).toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
    expect(normalizeEditorPreferences(42)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("passes through a fully valid object unchanged", () => {
    const prefs = {
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "monokai" as const,
    };
    expect(normalizeEditorPreferences(prefs)).toEqual(prefs);
  });

  it("fills missing fields from the defaults (partial JSON)", () => {
    const result = normalizeEditorPreferences({ theme: "github-dark" });
    expect(result).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      theme: "github-dark",
    });
  });

  it("falls back to defaults when any field is invalid", () => {
    // fontSize out of range and theme unknown are invalid → the whole partial
    // parse fails, so it falls back to defaults (never a half-broken object).
    const result = normalizeEditorPreferences({
      fontSize: 999,
      tabSize: 4,
      theme: "solarized",
    });
    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("keeps a valid partial when no field is invalid", () => {
    const result = normalizeEditorPreferences({ tabSize: 8, minimap: true });
    expect(result).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      tabSize: 8,
      minimap: true,
    });
  });

  it("ignores unknown extra keys", () => {
    const result = normalizeEditorPreferences({
      fontSize: 14,
      somethingElse: "ignored",
    });
    expect(result).toEqual({ ...DEFAULT_EDITOR_PREFERENCES, fontSize: 14 });
  });
});
