import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailFromResetIdentifier } from "@/lib/auth/password-reset";
import { checkRateLimit, getClientIp, tooManyRequestsResponse } from "@/lib/rate-limit";

// POST /api/auth/reset-password — completes the password-reset flow.
// Validates the single-use token, sets a new bcrypt hash on the user, and
// consumes the token. Password rules match registration. Returns the project's
// { success, data?, error? } shape; an invalid/expired token is a 400 with a
// stable `code` the UI can branch on.
const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit("resetPassword", getClientIp(request));
    if (!rateLimit.success) {
      return tooManyRequestsResponse(rateLimit.reset);
    }

    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    const record = await prisma.verificationToken.findUnique({ where: { token } });

    // Must exist and be a reset token (not an email-verification token sharing
    // the table). emailFromResetIdentifier returns null for non-reset tokens.
    const email = record ? emailFromResetIdentifier(record.identifier) : null;
    if (!record || !email) {
      return NextResponse.json(
        { success: false, error: "This reset link is invalid or has already been used.", code: "invalid" },
        { status: 400 },
      );
    }

    if (record.expires < new Date()) {
      // Expired — consume it so it can't linger, then report.
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { success: false, error: "This reset link has expired. Please request a new one.", code: "expired" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // OAuth-only or deleted user — nothing to reset. Consume the token.
    if (!user?.password) {
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { success: false, error: "This reset link is invalid or has already been used.", code: "invalid" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Update the password and consume the token atomically. A successful reset
    // proves email ownership, so verify the address too if it wasn't already.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
          emailVerified: user.emailVerified ?? new Date(),
        },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { message: "Your password has been reset. You can now sign in." },
    });
  } catch (error) {
    console.error("[reset-password] failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
