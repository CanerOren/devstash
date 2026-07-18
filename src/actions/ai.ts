"use server";

import { z } from "zod";

import { requireProUser } from "@/lib/ai/pro";
import { checkRateLimit } from "@/lib/rate-limit";
import { isAIConfigured } from "@/lib/ai/openai";
import { generateTagSuggestions } from "@/lib/ai/auto-tags";

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
