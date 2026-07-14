import { describe, it, expect } from "vitest";

import { commandFilter, isSubsequence } from "@/lib/search-filter";

describe("isSubsequence", () => {
  it("matches characters present in order with gaps", () => {
    expect(isSubsequence("abc", "aXbXc")).toBe(true);
    expect(isSubsequence("test", "the essential test")).toBe(true);
  });

  it("rejects when order is broken or a char is missing", () => {
    expect(isSubsequence("acb", "abc")).toBe(false);
    expect(isSubsequence("xyz", "abc")).toBe(false);
  });

  it("treats the empty query as a match", () => {
    expect(isSubsequence("", "anything")).toBe(true);
  });
});

describe("commandFilter", () => {
  it("shows everything for an empty query (browse mode)", () => {
    expect(commandFilter("id", "", ["Anything"])).toBe(1);
    expect(commandFilter("id", "   ", ["Anything"])).toBe(1);
  });

  it("ranks a label prefix highest, then a mid-label substring", () => {
    const prefix = commandFilter("id", "use", ["useDebounce hook"]);
    const contains = commandFilter("id", "debounce", ["useDebounce hook"]);
    expect(prefix).toBe(1);
    expect(contains).toBe(0.9);
    expect(prefix).toBeGreaterThan(contains);
  });

  it("fuzzy-matches the label (subsequence) below a literal substring", () => {
    // "udh" isn't a substring of "useDebounce hook" but is a subsequence.
    const fuzzy = commandFilter("id", "udh", ["useDebounce hook"]);
    expect(fuzzy).toBe(0.7);
  });

  it("matches secondary text (tags/content) only by literal substring", () => {
    const score = commandFilter("id", "react", [
      "useDebounce hook",
      "react",
      "hooks typescript",
    ]);
    expect(score).toBe(0.5);
  });

  it("ranks a label match above a secondary-text match", () => {
    const labelHit = commandFilter("id", "hook", ["useDebounce hook", "react"]);
    const extraHit = commandFilter("id", "react", ["useDebounce hook", "react"]);
    expect(labelHit).toBeGreaterThan(extraHit);
  });

  // The reported bug: typing "test" surfaced almost every item because cmdk's
  // default filter fuzzy-matched t‑e‑s‑t scattered across the content preview.
  it("does NOT match when the query only appears as a scattered subsequence of the content", () => {
    // Label has no "test" subsequence; content contains t,e,s,t in order but not
    // as the literal substring "test".
    const score = commandFilter("id", "test", [
      "useDebounce hook",
      "hooks",
      "the value resets after a timeout", // t…e…s…t present, "test" is not
    ]);
    expect(score).toBe(0);
  });

  it("still matches an item genuinely titled or containing the query", () => {
    expect(commandFilter("id", "test", ["Test"])).toBe(1);
    expect(
      commandFilter("id", "test", ["My snippet", "unit test helpers"]),
    ).toBe(0.5);
  });
});
