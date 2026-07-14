import { describe, it, expect } from "vitest";

import {
  parsePageParam,
  getPagination,
  pageSequence,
  ITEMS_PER_PAGE,
} from "@/lib/pagination";

describe("parsePageParam", () => {
  it("returns 1 for missing / empty values", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("")).toBe(1);
  });

  it("parses a valid positive integer string", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("clamps non-positive and non-integer values to 1", () => {
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-2")).toBe(1);
    expect(parsePageParam("1.5")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
  });

  it("uses the first entry when given an array (repeated param)", () => {
    expect(parsePageParam(["2", "5"])).toBe(2);
  });
});

describe("getPagination", () => {
  it("computes totalPages, skip and take for a middle page", () => {
    const p = getPagination(2, 50, 21);
    expect(p).toMatchObject({
      page: 2,
      perPage: 21,
      totalCount: 50,
      totalPages: 3,
      hasPrev: true,
      hasNext: true,
      skip: 21,
      take: 21,
    });
  });

  it("clamps a page past the end to the last page", () => {
    const p = getPagination(99, 50, 21);
    expect(p.page).toBe(3);
    expect(p.skip).toBe(42);
    expect(p.hasNext).toBe(false);
    expect(p.hasPrev).toBe(true);
  });

  it("clamps a page below 1 to the first page", () => {
    const p = getPagination(0, 50, 21);
    expect(p.page).toBe(1);
    expect(p.skip).toBe(0);
    expect(p.hasPrev).toBe(false);
  });

  it("yields a single page (page 1) for an empty result set", () => {
    const p = getPagination(1, 0, ITEMS_PER_PAGE);
    expect(p).toMatchObject({
      page: 1,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
      skip: 0,
    });
  });

  it("rounds partial pages up", () => {
    // 22 items at 21/page → 2 pages.
    expect(getPagination(1, 22, 21).totalPages).toBe(2);
  });
});

describe("pageSequence", () => {
  it("lists every page when they fit without gaps", () => {
    expect(pageSequence(1, 3)).toEqual([1, 2, 3]);
  });

  it("inserts ellipses around a windowed current page", () => {
    expect(pageSequence(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("omits the leading ellipsis near the start", () => {
    expect(pageSequence(2, 10)).toEqual([1, 2, 3, "ellipsis", 10]);
  });

  it("omits the trailing ellipsis near the end", () => {
    expect(pageSequence(9, 10)).toEqual([1, "ellipsis", 8, 9, 10]);
  });

  it("returns a single entry for a one-page set", () => {
    expect(pageSequence(1, 1)).toEqual([1]);
  });
});
