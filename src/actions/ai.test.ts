import { describe, it, expect, vi, beforeEach } from "vitest";

// generateAutoTags orchestrates the Pro gate, rate limit, config check, and the
// model call. Mock each seam so these tests exercise only the action's
// validation + { success, error } control flow.
const {
  requireProUser,
  checkRateLimit,
  isAIConfigured,
  generateTagSuggestions,
  generateItemDescription,
} = vi.hoisted(() => ({
  requireProUser: vi.fn(),
  checkRateLimit: vi.fn(),
  isAIConfigured: vi.fn(),
  generateTagSuggestions: vi.fn(),
  generateItemDescription: vi.fn(),
}));

vi.mock("@/lib/ai/pro", () => ({ requireProUser }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/ai/openai", () => ({ isAIConfigured }));
vi.mock("@/lib/ai/auto-tags", () => ({ generateTagSuggestions }));
vi.mock("@/lib/ai/description", () => ({ generateItemDescription }));

import { generateAutoTags, generateDescription } from "@/actions/ai";

beforeEach(() => {
  vi.clearAllMocks();
  // Happy-path defaults; individual tests override as needed.
  requireProUser.mockResolvedValue({ userId: "user_1" });
  checkRateLimit.mockResolvedValue({ success: true, remaining: 19, reset: 0 });
  isAIConfigured.mockReturnValue(true);
  generateTagSuggestions.mockResolvedValue(["react", "hooks"]);
  generateItemDescription.mockResolvedValue("A hook that debounces a value.");
});

const input = { title: "useDebounce hook", content: "export function useDebounce" };

describe("generateAutoTags", () => {
  it("rejects an empty title without gating or calling the model", async () => {
    const result = await generateAutoTags({ title: "   ", content: "x" });

    expect(result.success).toBe(false);
    expect(requireProUser).not.toHaveBeenCalled();
    expect(generateTagSuggestions).not.toHaveBeenCalled();
  });

  it("returns the Pro-gate error and never calls the model", async () => {
    requireProUser.mockResolvedValue({ error: "AI features are available on the Pro plan." });

    const result = await generateAutoTags(input);

    expect(result).toEqual({
      success: false,
      error: "AI features are available on the Pro plan.",
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(generateTagSuggestions).not.toHaveBeenCalled();
  });

  it("returns a rate-limit error when the quota is exceeded", async () => {
    checkRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: 0 });

    const result = await generateAutoTags(input);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/limit/i);
    expect(generateTagSuggestions).not.toHaveBeenCalled();
  });

  it("keys the rate limit by the userId from the gate", async () => {
    await generateAutoTags(input);
    expect(checkRateLimit).toHaveBeenCalledWith("aiAutoTag", "user_1");
  });

  it("errors when AI isn't configured", async () => {
    isAIConfigured.mockReturnValue(false);

    const result = await generateAutoTags(input);

    expect(result.success).toBe(false);
    expect(generateTagSuggestions).not.toHaveBeenCalled();
  });

  it("returns the model's tags on success", async () => {
    const result = await generateAutoTags(input);

    expect(result).toEqual({ success: true, data: { tags: ["react", "hooks"] } });
  });

  it("succeeds with an empty tag list when the model has no suggestions", async () => {
    generateTagSuggestions.mockResolvedValue([]);

    const result = await generateAutoTags(input);

    expect(result).toEqual({ success: true, data: { tags: [] } });
  });

  it("returns a generic error when the model call throws", async () => {
    generateTagSuggestions.mockRejectedValue(new Error("openai down"));

    const result = await generateAutoTags(input);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

const descInput = {
  typeName: "snippet",
  title: "useDebounce hook",
  content: "export function useDebounce",
};

describe("generateDescription", () => {
  it("rejects an empty title without gating or calling the model", async () => {
    const result = await generateDescription({ typeName: "note", title: "   " });

    expect(result.success).toBe(false);
    expect(requireProUser).not.toHaveBeenCalled();
    expect(generateItemDescription).not.toHaveBeenCalled();
  });

  it("returns the Pro-gate error and never calls the model", async () => {
    requireProUser.mockResolvedValue({
      error: "AI features are available on the Pro plan.",
    });

    const result = await generateDescription(descInput);

    expect(result).toEqual({
      success: false,
      error: "AI features are available on the Pro plan.",
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(generateItemDescription).not.toHaveBeenCalled();
  });

  it("returns a rate-limit error when the quota is exceeded", async () => {
    checkRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: 0 });

    const result = await generateDescription(descInput);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/limit/i);
    expect(generateItemDescription).not.toHaveBeenCalled();
  });

  it("keys the rate limit by the userId from the gate", async () => {
    await generateDescription(descInput);
    expect(checkRateLimit).toHaveBeenCalledWith("aiDescription", "user_1");
  });

  it("errors when AI isn't configured", async () => {
    isAIConfigured.mockReturnValue(false);

    const result = await generateDescription(descInput);

    expect(result.success).toBe(false);
    expect(generateItemDescription).not.toHaveBeenCalled();
  });

  it("returns the model's description on success", async () => {
    const result = await generateDescription(descInput);

    expect(result).toEqual({
      success: true,
      data: { description: "A hook that debounces a value." },
    });
  });

  it("succeeds with an empty description when the model has nothing", async () => {
    generateItemDescription.mockResolvedValue("");

    const result = await generateDescription(descInput);

    expect(result).toEqual({ success: true, data: { description: "" } });
  });

  it("works off the title alone (no content/url) for a file item", async () => {
    const result = await generateDescription({
      typeName: "file",
      title: "invoice.pdf",
    });

    expect(result.success).toBe(true);
    expect(generateItemDescription).toHaveBeenCalledWith(
      expect.objectContaining({ typeName: "file", title: "invoice.pdf" }),
    );
  });

  it("drops stale content when the type is a link (keeps the url)", async () => {
    // Simulates switching a snippet → link: leftover code content lingers in
    // form state and must not be summarized alongside the link.
    await generateDescription({
      typeName: "link",
      title: "Tailwind Docs",
      url: "https://tailwindcss.com",
      content: "export function useThrottle() {}",
      language: "typescript",
    });

    expect(generateItemDescription).toHaveBeenCalledWith({
      typeName: "link",
      title: "Tailwind Docs",
      url: "https://tailwindcss.com",
      content: "",
      language: "",
    });
  });

  it("drops a stale url and language when the type is a note", async () => {
    await generateDescription({
      typeName: "note",
      title: "Meeting notes",
      content: "Discussed the roadmap.",
      url: "https://example.com",
      language: "typescript",
    });

    expect(generateItemDescription).toHaveBeenCalledWith({
      typeName: "note",
      title: "Meeting notes",
      content: "Discussed the roadmap.",
      url: "",
      language: "",
    });
  });

  it("keeps content and language for a snippet", async () => {
    await generateDescription({
      typeName: "snippet",
      title: "useThrottle hook",
      content: "export function useThrottle() {}",
      language: "typescript",
    });

    expect(generateItemDescription).toHaveBeenCalledWith({
      typeName: "snippet",
      title: "useThrottle hook",
      content: "export function useThrottle() {}",
      url: "",
      language: "typescript",
    });
  });

  it("returns a generic error when the model call throws", async () => {
    generateItemDescription.mockRejectedValue(new Error("openai down"));

    const result = await generateDescription(descInput);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
