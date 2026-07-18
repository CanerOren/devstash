import "server-only"; // hard guard: a client import becomes a build error

import OpenAI from "openai";

// Lazy OpenAI client singleton, mirroring the fail-safe pattern in
// src/lib/r2.ts and src/lib/rate-limit.ts: build once, cache the "not
// configured" outcome as null so callers can return a friendly error instead of
// throwing. The API key is read here only — never exposed to the client, never
// returned in errors, never logged.

let client: OpenAI | null = null;
let checked = false;

export function getOpenAI(): OpenAI | null {
  if (checked) return client;
  checked = true;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null; // not configured → caller returns a friendly error

  client = new OpenAI({
    apiKey,
    maxRetries: 2, // SDK default; auto-retries 429/5xx with exponential backoff
    timeout: 30_000, // 30s — these are short calls; don't hang a server action
  });
  return client;
}

// The model id lives in one constant so switching models is a one-line change.
// gpt-5-nano must be called via the Responses API (see src/lib/ai/auto-tags.ts).
export const AI_MODEL = "gpt-5-nano";

export function isAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
