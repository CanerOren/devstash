import { describe, it, expect, vi } from "vitest";

// optimize.ts imports openai.ts, which imports "server-only" (throws outside a
// server component). Mock it away — these tests only cover the pure helpers.
vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => null,
  AI_MODEL: "gpt-5-nano",
}));

import {
  sanitizeOptimizedPrompt,
  buildOptimizePrompt,
  MAX_OPTIMIZE_CONTENT_CHARS,
  MAX_OPTIMIZED_PROMPT_CHARS,
} from "@/lib/ai/optimize";

// Pure helpers — no OpenAI client involved (generateOptimizedPrompt, which does
// call the client, is exercised through the action tests with the lib mocked).

describe("sanitizeOptimizedPrompt", () => {
  it("returns a clean prompt unchanged", () => {
    const prompt = "Review the following code for bugs.\n\n- focus on edge cases";
    expect(sanitizeOptimizedPrompt(prompt)).toBe(prompt);
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeOptimizedPrompt("   improve this   ")).toBe("improve this");
  });

  it("strips a wrapping fenced code block", () => {
    const fenced = "```\nWrite a haiku about the sea.\n```";
    expect(sanitizeOptimizedPrompt(fenced)).toBe("Write a haiku about the sea.");
  });

  it("strips a wrapping fenced code block with a language tag", () => {
    const fenced = "```markdown\nYou are a helpful assistant.\n```";
    expect(sanitizeOptimizedPrompt(fenced)).toBe("You are a helpful assistant.");
  });

  it("strips a single pair of surrounding quotes", () => {
    expect(sanitizeOptimizedPrompt('"Summarize the article."')).toBe(
      "Summarize the article.",
    );
  });

  it("preserves internal newlines and structure", () => {
    const prompt = "Role: reviewer\n\nTask:\n- one\n- two";
    expect(sanitizeOptimizedPrompt(prompt)).toBe(prompt);
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeOptimizedPrompt("")).toBe("");
  });

  it("caps overly long text at a whitespace boundary", () => {
    const long = "word ".repeat(2000).trim(); // ~9999 chars
    const out = sanitizeOptimizedPrompt(long, 100);

    expect(out.length).toBeLessThanOrEqual(100);
    expect(out.endsWith("word")).toBe(true);
    expect(out).not.toMatch(/\s$/);
  });
});

describe("buildOptimizePrompt", () => {
  it("includes the prompt content under a label", () => {
    const built = buildOptimizePrompt({ content: "Explain recursion." });

    expect(built).toContain("Prompt to improve:");
    expect(built).toContain("Explain recursion.");
  });

  it("truncates very long content to the char budget", () => {
    const huge = "x".repeat(MAX_OPTIMIZE_CONTENT_CHARS + 500);
    const built = buildOptimizePrompt({ content: huge });

    expect(built).toContain("x".repeat(MAX_OPTIMIZE_CONTENT_CHARS));
    expect(built).not.toContain("x".repeat(MAX_OPTIMIZE_CONTENT_CHARS + 1));
  });
});

describe("optimize constants", () => {
  it("exposes sane char budgets", () => {
    expect(MAX_OPTIMIZE_CONTENT_CHARS).toBeGreaterThan(0);
    expect(MAX_OPTIMIZED_PROMPT_CHARS).toBeGreaterThan(0);
  });
});
