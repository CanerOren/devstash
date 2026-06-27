import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueVerificationEmail, isEmailVerificationEnabled } from "@/lib/auth/verification";
import { checkRateLimit, getClientIp, tooManyRequestsResponse } from "@/lib/rate-limit";

// POST /api/auth/resend-verification — re-sends the verification email.
// Always returns a generic success (never reveals whether the email exists or
// is already verified) to avoid account enumeration. Returns the project's
// { success, data?, error? } shape.
const resendSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // Keyed by IP + email so abuse of the send endpoint is throttled even when
    // verification is disabled below. A 429 reveals nothing about the account.
    const rateLimit = await checkRateLimit("resendVerification", `${getClientIp(request)}:${email}`);
    if (!rateLimit.success) {
      return tooManyRequestsResponse(rateLimit.reset);
    }

    // When verification is disabled globally, there is nothing to resend — but
    // still return the same generic success so the response is indistinguishable.
    if (!isEmailVerificationEnabled()) {
      return NextResponse.json({
        success: true,
        data: { message: "If that account exists and is unverified, a new link is on its way." },
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Only send for a credentials user (has a password) who is not yet verified.
    // Silently no-op otherwise — the response is identical either way.
    if (user?.password && !user.emailVerified) {
      await issueVerificationEmail({
        origin: new URL(request.url).origin,
        email: user.email,
        name: user.name,
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: "If that account exists and is unverified, a new link is on its way." },
    });
  } catch (error) {
    console.error("[resend-verification] failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
