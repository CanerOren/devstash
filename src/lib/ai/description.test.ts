import { describe, it, expect, vi } from "vitest";

// description.ts imports openai.ts, which imports "server-only" (throws outside a
// server component). Mock it away — these tests only cover the pure helpers.
vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => null,
  AI_MODEL: "gpt-5-nano",
}));

import {
  sanitizeDescription,
  buildDescriptionPrompt,
  MAX_DESCRIPTION_CONTENT_CHARS,
  MAX_DESCRIPTION_CHARS,
} from "@/lib/ai/description";

// Pure helpers — no OpenAI client involved (generateItemDescription, which does
// call the client, is exercised through the action tests with the lib mocked).

describe("sanitizeDescription", () => {
  it("returns clean text unchanged", () => {
    expect(sanitizeDescription("A React hook that debounces a value.")).toBe(
      "A React hook that debounces a value.",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeDescription("   hello world   ")).toBe("hello world");
  });

  it("strips a stray pair of wrapping quotes", () => {
    expect(sanitizeDescription('"A debounce hook."')).toBe("A debounce hook.");
    expect(sanitizeDescription("“A debounce hook.”")).toBe("A debounce hook.");
  });

  it("collapses internal newlines and whitespace to single spaces", () => {
    expect(sanitizeDescription("line one\n\nline   two")).toBe("line one line two");
  });

  it("returns '' for empty input", () => {
    expect(sanitizeDescription("")).toBe("");
    expect(sanitizeDescription("   ")).toBe("");
  });

  it("caps overly long output at a word boundary", () => {
    const long = Array.from({ length: 100 }, () => "word").join(" ");
    const out = sanitizeDescription(long);
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION_CHARS);
    // Cut on a boundary — no partial trailing token.
    expect(out.endsWith("word")).toBe(true);
    expect(out).not.toMatch(/\s$/);
  });
});

describe("buildDescriptionPrompt", () => {
  it("includes type, title, language, url, and truncated content", () => {
    const prompt = buildDescriptionPrompt({
      typeName: "snippet",
      title: "My Hook",
      language: "typescript",
      url: "https://example.com",
      content: "y".repeat(MAX_DESCRIPTION_CONTENT_CHARS + 100),
    });

    expect(prompt).toContain("Type: snippet");
    expect(prompt).toContain("Title: My Hook");
    expect(prompt).toContain("Language: typescript");
    expect(prompt).toContain("URL: https://example.com");
    expect(prompt).toContain("Content:");
    // Content is clipped to the budget rather than passed through whole.
    expect(prompt.length).toBeLessThan(MAX_DESCRIPTION_CONTENT_CHARS + 200);
  });

  it("omits optional lines when empty but always keeps the title", () => {
    const prompt = buildDescriptionPrompt({ typeName: "", title: "Just a title" });

    expect(prompt).toContain("Title: Just a title");
    expect(prompt).not.toContain("Type:");
    expect(prompt).not.toContain("Language:");
    expect(prompt).not.toContain("URL:");
    expect(prompt).not.toContain("Content:");
  });

  it("includes the url for link items with no content", () => {
    const prompt = buildDescriptionPrompt({
      typeName: "link",
      title: "Tailwind Docs",
      url: "https://tailwindcss.com",
    });

    expect(prompt).toContain("Type: link");
    expect(prompt).toContain("URL: https://tailwindcss.com");
    expect(prompt).not.toContain("Content:");
  });
});
