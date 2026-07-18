import { describe, it, expect, vi } from "vitest";

// explain.ts imports openai.ts, which imports "server-only" (throws outside a
// server component). Mock it away — these tests only cover the pure helpers.
vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => null,
  AI_MODEL: "gpt-5-nano",
}));

import {
  sanitizeExplanation,
  buildExplainPrompt,
  MAX_EXPLAIN_CONTENT_CHARS,
  MAX_EXPLANATION_CHARS,
} from "@/lib/ai/explain";

// Pure helpers — no OpenAI client involved (generateCodeExplanation, which does
// call the client, is exercised through the action tests with the lib mocked).

describe("sanitizeExplanation", () => {
  it("returns clean Markdown unchanged", () => {
    const md = "This function debounces a value.\n\n- point one\n- point two";
    expect(sanitizeExplanation(md)).toBe(md);
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeExplanation("   hello world   ")).toBe("hello world");
  });

  it("preserves internal newlines (unlike the description sanitizer)", () => {
    expect(sanitizeExplanation("line one\n\nline two")).toBe(
      "line one\n\nline two",
    );
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeExplanation("")).toBe("");
  });

  it("caps overly long text at a whitespace boundary", () => {
    const long = "word ".repeat(2000).trim(); // ~9999 chars
    const out = sanitizeExplanation(long, 100);

    expect(out.length).toBeLessThanOrEqual(100);
    // Cut on a boundary → no partial trailing word.
    expect(out.endsWith("word")).toBe(true);
    expect(out).not.toMatch(/\s$/);
  });
});

describe("buildExplainPrompt", () => {
  it("includes the language line when present", () => {
    const prompt = buildExplainPrompt({
      content: "const x = 1;",
      language: "typescript",
    });

    expect(prompt).toContain("Language: typescript");
    expect(prompt).toContain("Code:\nconst x = 1;");
  });

  it("omits the language line when absent", () => {
    const prompt = buildExplainPrompt({ content: "ls -la" });

    expect(prompt).not.toContain("Language:");
    expect(prompt).toContain("Code:\nls -la");
  });

  it("truncates very long content to the char budget", () => {
    const huge = "x".repeat(MAX_EXPLAIN_CONTENT_CHARS + 500);
    const prompt = buildExplainPrompt({ content: huge });

    // The prompt carries at most the budget worth of code (plus the label).
    expect(prompt).toContain("x".repeat(MAX_EXPLAIN_CONTENT_CHARS));
    expect(prompt).not.toContain("x".repeat(MAX_EXPLAIN_CONTENT_CHARS + 1));
  });
});

describe("explain constants", () => {
  it("exposes sane char budgets", () => {
    expect(MAX_EXPLAIN_CONTENT_CHARS).toBeGreaterThan(0);
    expect(MAX_EXPLANATION_CHARS).toBeGreaterThan(0);
  });
});
