"use server";

import { z } from "zod";

import { requireProUser } from "@/lib/ai/pro";
import { checkRateLimit } from "@/lib/rate-limit";
import { isAIConfigured } from "@/lib/ai/openai";
import { generateTagSuggestions } from "@/lib/ai/auto-tags";
import { generateItemDescription } from "@/lib/ai/description";
import { generateCodeExplanation } from "@/lib/ai/explain";

// Server actions for AI features. They follow the project's
// { success, data?, error? } shape. Every action runs the same preamble:
// validate input → Pro gate (server-side enforcement) → per-user rate limit →
// confirm AI is configured, then call the model.

const autoTagSchema = z.object({
  title: z.string().trim().min(1, "Add a title first"),
  // Content is optional (e.g. a link with no body) — tagging works off the
  // title alone in that case.
  content: z.preprocess((v) => v ?? "", z.string()),
  language: z.preprocess((v) => v ?? "", z.string()),
});

// Content/language are optional — tagging works off the title alone, and the
// preprocess coerces missing values to "". (z.input would mark the preprocessed
// fields as required `unknown`, so type it explicitly.)
export interface GenerateAutoTagsInput {
  title: string;
  content?: string | null;
  language?: string | null;
}

export interface GenerateAutoTagsResult {
  success: boolean;
  data?: { tags: string[] };
  error?: string;
}

// Suggest 3–5 freeform tags for an item from its title + content. Pro-only and
// rate-limited. Returns an empty tag list (still success) when the model has no
// suggestions, so the UI can show "No suggestions" rather than an error.
export async function generateAutoTags(
  input: GenerateAutoTagsInput,
): Promise<GenerateAutoTagsResult> {
  try {
    const parsed = autoTagSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    // Server-side Pro gating — the real enforcement (UI hiding is complementary).
    const gate = await requireProUser();
    if ("error" in gate) {
      return { success: false, error: gate.error };
    }

    // Per-user quota. Fails open when Upstash isn't configured (dev), so it
    // never blocks AI when the limiter is down.
    const limit = await checkRateLimit("aiAutoTag", gate.userId);
    if (!limit.success) {
      return {
        success: false,
        error: "You've hit your AI usage limit. Please try again later.",
      };
    }

    if (!isAIConfigured()) {
      return { success: false, error: "AI features are not configured." };
    }

    const tags = await generateTagSuggestions(parsed.data);
    return { success: true, data: { tags } };
  } catch (error) {
    console.error("[generateAutoTags] failed:", error);
    return {
      success: false,
      error: "Couldn't generate tags right now. Please try again.",
    };
  }
}

const descriptionSchema = z.object({
  // Type/content/url/language are all optional — a description works off
  // whatever is available (a file item may have only a title). Coerce missing
  // values to "".
  typeName: z.preprocess((v) => v ?? "", z.string()),
  title: z.string().trim().min(1, "Add a title first"),
  content: z.preprocess((v) => v ?? "", z.string()),
  url: z.preprocess((v) => v ?? "", z.string()),
  language: z.preprocess((v) => v ?? "", z.string()),
});

// Which fields actually apply to a given type. The forms keep stale field values
// in state after a type switch (e.g. leftover code content when switching a
// snippet to a link), so — like the createItem action — we drop fields that
// don't apply to the chosen type before summarizing, or the model conflates them.
const DESC_CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const DESC_LANGUAGE_TYPES = new Set(["snippet", "command"]);

export interface GenerateDescriptionInput {
  typeName?: string | null;
  title: string;
  content?: string | null;
  url?: string | null;
  language?: string | null;
}

export interface GenerateDescriptionResult {
  success: boolean;
  data?: { description: string };
  error?: string;
}

// Generate a concise 1–2 sentence description for an item from its current
// (unsaved) form state. Pro-only and rate-limited. Returns an empty string
// (still success) when the model has nothing usable, so the UI can show a
// friendly "couldn't generate" hint rather than an error.
export async function generateDescription(
  input: GenerateDescriptionInput,
): Promise<GenerateDescriptionResult> {
  try {
    const parsed = descriptionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const gate = await requireProUser();
    if ("error" in gate) {
      return { success: false, error: gate.error };
    }

    const limit = await checkRateLimit("aiDescription", gate.userId);
    if (!limit.success) {
      return {
        success: false,
        error: "You've hit your AI usage limit. Please try again later.",
      };
    }

    if (!isAIConfigured()) {
      return { success: false, error: "AI features are not configured." };
    }

    // Only summarize the fields relevant to this type (drop stale content/url/
    // language a type switch may have left behind).
    const { typeName, title, content, url, language } = parsed.data;
    const description = await generateItemDescription({
      typeName,
      title,
      content: DESC_CONTENT_TYPES.has(typeName) ? content : "",
      url: typeName === "link" ? url : "",
      language: DESC_LANGUAGE_TYPES.has(typeName) ? language : "",
    });
    return { success: true, data: { description } };
  } catch (error) {
    console.error("[generateDescription] failed:", error);
    return {
      success: false,
      error: "Couldn't generate a description right now. Please try again.",
    };
  }
}

const explainSchema = z.object({
  // There must be code to explain (all-whitespace is rejected). The trimmed
  // value is what we send — leading/trailing blank lines carry no signal, and
  // inner indentation is preserved.
  content: z.string().trim().min(1, "There's no code to explain."),
  // Optional — the model can explain code without a language hint. Coerce
  // missing to "".
  language: z.preprocess((v) => v ?? "", z.string()),
});

export interface ExplainCodeInput {
  content: string;
  language?: string | null;
}

export interface ExplainCodeResult {
  success: boolean;
  data?: { explanation: string };
  error?: string;
}

// Generate a concise Markdown explanation of a snippet or command from its
// content. Pro-only and rate-limited. Explanations are not persisted — they're
// regenerated on each request. Returns an empty string (still success) when the
// model has nothing usable, so the UI can show a friendly hint rather than an
// error.
export async function explainCode(
  input: ExplainCodeInput,
): Promise<ExplainCodeResult> {
  try {
    const parsed = explainSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const gate = await requireProUser();
    if ("error" in gate) {
      return { success: false, error: gate.error };
    }

    const limit = await checkRateLimit("aiExplain", gate.userId);
    if (!limit.success) {
      return {
        success: false,
        error: "You've hit your AI usage limit. Please try again later.",
      };
    }

    if (!isAIConfigured()) {
      return { success: false, error: "AI features are not configured." };
    }

    const explanation = await generateCodeExplanation(parsed.data);
    return { success: true, data: { explanation } };
  } catch (error) {
    console.error("[explainCode] failed:", error);
    return {
      success: false,
      error: "Couldn't explain this code right now. Please try again.",
    };
  }
}
