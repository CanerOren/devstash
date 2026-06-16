import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issuePasswordResetEmail } from "@/lib/auth/password-reset";

// POST /api/auth/forgot-password — starts the password-reset flow.
// Always returns a generic success (never reveals whether the email exists or
// is a credentials account) to avoid account enumeration. Returns the project's
// { success, data?, error? } shape.
const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),
});

const GENERIC_MESSAGE =
  "If an account exists for that email, a password reset link is on its way.";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Only send for a credentials user (has a password). OAuth-only users have
    // no password to reset; silently no-op — the response is identical either way.
    if (user?.password) {
      await issuePasswordResetEmail({
        origin: new URL(request.url).origin,
        email: user.email,
        name: user.name,
      });
    }

    return NextResponse.json({ success: true, data: { message: GENERIC_MESSAGE } });
  } catch (error) {
    console.error("[forgot-password] failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
