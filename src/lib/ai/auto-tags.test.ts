import { describe, it, expect, vi } from "vitest";

// auto-tags.ts imports openai.ts, which imports "server-only" (throws outside a
// server component). Mock it away — these tests only cover the pure helpers.
vi.mock("@/lib/ai/openai", () => ({
  getOpenAI: () => null,
  AI_MODEL: "gpt-5-nano",
}));

import {
  truncateContent,
  normalizeTags,
  parseTagsResponse,
  buildTagUserPrompt,
  MAX_CONTENT_CHARS,
} from "@/lib/ai/auto-tags";

// Pure helpers — no OpenAI client involved (generateTagSuggestions, which does
// call the client, is exercised through the action tests with the lib mocked).

describe("truncateContent", () => {
  it("returns short content unchanged", () => {
    expect(truncateContent("hello")).toBe("hello");
  });

  it("clips content longer than the max", () => {
    const long = "x".repeat(MAX_CONTENT_CHARS + 500);
    expect(truncateContent(long)).toHaveLength(MAX_CONTENT_CHARS);
  });

  it("honors a custom max", () => {
    expect(truncateContent("abcdef", 3)).toBe("abc");
  });
});

describe("normalizeTags", () => {
  it("lowercases, trims, and strips leading #", () => {
    expect(normalizeTags(["  React ", "#Hooks", "TYPEScript"])).toEqual([
      "react",
      "hooks",
      "typescript",
    ]);
  });

  it("dedupes case-insensitively", () => {
    expect(normalizeTags(["react", "React", "REACT"])).toEqual(["react"]);
  });

  it("drops blanks and non-string entries", () => {
    expect(normalizeTags(["ok", "", "   ", 42, null, { a: 1 }])).toEqual(["ok"]);
  });

  it("caps at 5 tags", () => {
    expect(normalizeTags(["a", "b", "c", "d", "e", "f", "g"])).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  it("returns [] for a non-array", () => {
    expect(normalizeTags("react")).toEqual([]);
    expect(normalizeTags(null)).toEqual([]);
  });
});

describe("parseTagsResponse", () => {
  it("parses the {\"tags\": [...]} object shape", () => {
    expect(parseTagsResponse('{"tags": ["React", "Hooks"]}')).toEqual([
      "react",
      "hooks",
    ]);
  });

  it("parses a bare array shape", () => {
    expect(parseTagsResponse('["Docker", "CI"]')).toEqual(["docker", "ci"]);
  });

  it("returns [] for empty or whitespace text", () => {
    expect(parseTagsResponse("")).toEqual([]);
    expect(parseTagsResponse("   ")).toEqual([]);
  });

  it("returns [] for invalid JSON", () => {
    expect(parseTagsResponse("not json")).toEqual([]);
  });

  it("returns [] for an object without a tags array", () => {
    expect(parseTagsResponse('{"foo": "bar"}')).toEqual([]);
  });
});

describe("buildTagUserPrompt", () => {
  it("includes title, language, and truncated content", () => {
    const prompt = buildTagUserPrompt({
      title: "My Hook",
      content: "y".repeat(MAX_CONTENT_CHARS + 100),
      language: "typescript",
    });

    expect(prompt).toContain("Title: My Hook");
    expect(prompt).toContain("Language: typescript");
    expect(prompt).toContain("Content:");
    // Content is clipped to the budget (+ the labels + json instruction line):
    // the input content was MAX + 100 chars, so a prompt near MAX proves it was
    // truncated rather than passed through whole.
    expect(prompt.length).toBeLessThan(MAX_CONTENT_CHARS + 200);
  });

  it("omits the language and content lines when empty (but keeps the json instruction)", () => {
    const prompt = buildTagUserPrompt({ title: "Just a title", content: "" });
    expect(prompt).toContain("Title: Just a title");
    expect(prompt).not.toContain("Language:");
    expect(prompt).not.toContain("Content:");
    // The Responses API requires "json" in the input for json_object format.
    expect(prompt.toLowerCase()).toContain("json");
  });
});
