import { describe, expect, it } from "vitest";

import {
  LANGUAGE_OPTIONS,
  languageLabelFor,
} from "@/lib/languages";

describe("languageLabelFor", () => {
  it("returns the curated label for a known value", () => {
    expect(languageLabelFor("typescript")).toBe("TypeScript");
    expect(languageLabelFor("csharp")).toBe("C#");
    expect(languageLabelFor("dockerfile")).toBe("Dockerfile");
  });

  it("is case-insensitive on the stored value", () => {
    expect(languageLabelFor("TypeScript")).toBe("TypeScript");
    expect(languageLabelFor("BASH")).toBe("Bash");
  });

  it("trims surrounding whitespace before matching", () => {
    expect(languageLabelFor("  python  ")).toBe("Python");
  });

  it("falls back to the raw value for an unknown-but-present language", () => {
    expect(languageLabelFor("cobol")).toBe("cobol");
    expect(languageLabelFor("Objective-C")).toBe("Objective-C");
  });

  it("returns an empty string for empty / null / undefined", () => {
    expect(languageLabelFor("")).toBe("");
    expect(languageLabelFor("   ")).toBe("");
    expect(languageLabelFor(null)).toBe("");
    expect(languageLabelFor(undefined)).toBe("");
  });

  it("has unique, lowercase option values", () => {
    const values = LANGUAGE_OPTIONS.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
    for (const value of values) {
      expect(value).toBe(value.toLowerCase());
    }
  });
});
