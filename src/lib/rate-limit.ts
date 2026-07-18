import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Sliding-window rate limiting for the auth endpoints, backed by Upstash Redis.
//
// Design notes:
// - **Fails open**: if Upstash isn't configured (no env vars) or a check errors,
//   the request is allowed. Rate limiting must never block auth because the
//   limiter is down — availability wins over the abuse protection here.
// - Limiters are created lazily and cached per name so we reuse the in-memory
//   ephemeral cache across requests in the same server instance.

// Upstash duration string, e.g. "15 m", "1 h". Kept narrow so the configs below
// stay type-checked.
type Duration = `${number} ${"s" | "m" | "h"}`;

export interface RateLimitConfig {
  limit: number;
  window: Duration;
}

// Per-endpoint limits. Keyed names double as the Redis key prefix, so changing a
// name resets that endpoint's existing buckets.
export const RATE_LIMITS = {
  login: { limit: 5, window: "15 m" },
  register: { limit: 3, window: "1 h" },
  forgotPassword: { limit: 3, window: "1 h" },
  resetPassword: { limit: 5, window: "15 m" },
  resendVerification: { limit: 3, window: "15 m" },
  // AI features: per-user quota that protects the OpenAI bill / enforces fair
  // use. Keyed by userId (not IP — these are authenticated).
  aiAutoTag: { limit: 20, window: "1 h" },
  aiDescription: { limit: 20, window: "1 h" },
} as const satisfies Record<string, RateLimitConfig>;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms when the window resets
}

// Lazy Redis singleton. `checked` guards against re-reading env on every call and
// lets us cache the "not configured" outcome as null.
let redis: Redis | null = null;
let redisChecked = false;

function getRedis(): Redis | null {
  if (redisChecked) return redis;
  redisChecked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    // Not configured — fail open. (Common in local dev.)
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, config: RateLimitConfig): Ratelimit | null {
  const cached = limiters.get(name);
  if (cached) return cached;

  const client = getRedis();
  if (!client) return null;

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: `ratelimit:${name}`,
    analytics: false,
  });
  limiters.set(name, limiter);
  return limiter;
}

/**
 * Check (and consume) one unit against the named limiter for `identifier`.
 * Returns `{ success, remaining, reset }`. Fails open (`success: true`) when
 * Upstash isn't configured or the check throws.
 */
export async function checkRateLimit(
  name: keyof typeof RATE_LIMITS,
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS[name],
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, config);
  if (!limiter) {
    return { success: true, remaining: config.limit, reset: Date.now() };
  }

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error(`[rate-limit] "${name}" check failed, failing open:`, error);
    return { success: true, remaining: config.limit, reset: Date.now() };
  }
}

/**
 * Extract the client IP from proxy headers (Vercel sets `x-forwarded-for`).
 * Falls back to "unknown" — callers should combine the IP with another
 * identifier (e.g. email) where possible so a missing IP doesn't share one
 * global bucket too coarsely.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Build a 429 JSON response with a `Retry-After` header. The message rounds the
 * wait up to whole minutes for a friendlier display.
 */
export function tooManyRequestsResponse(reset: number): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return NextResponse.json(
    {
      success: false,
      error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
