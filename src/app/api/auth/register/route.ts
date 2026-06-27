import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueVerificationEmail, isEmailVerificationEnabled } from "@/lib/auth/verification";
import { checkRateLimit, getClientIp, tooManyRequestsResponse } from "@/lib/rate-limit";

// POST /api/auth/register — create a new email/password user.
// Validates input, ensures passwords match, rejects duplicate emails, hashes the
// password with bcrypt, and creates the user. Returns { success, data?, error? }.
const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.email("Invalid email address").trim().toLowerCase(),
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
    const rateLimit = await checkRateLimit("register", getClientIp(request));
    if (!rateLimit.success) {
      return tooManyRequestsResponse(rateLimit.reset);
    }

    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationEnabled = isEmailVerificationEnabled();
    const user = await prisma.user.create({
      // When verification is disabled, mark the account verified at creation so
      // the sign-in gate passes and no email is sent.
      data: {
        name,
        email,
        password: passwordHash,
        emailVerified: verificationEnabled ? null : new Date(),
      },
      select: { id: true, name: true, email: true },
    });

    // Send the verification email only when verification is enabled. If it fails
    // to send, the account still exists — the user can request a resend from the
    // sign-in page.
    const emailSent = verificationEnabled
      ? await issueVerificationEmail({
          origin: new URL(request.url).origin,
          email: user.email,
          name: user.name,
        })
      : true;

    return NextResponse.json(
      { success: true, data: { ...user, emailSent, verificationRequired: verificationEnabled } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[register] failed to create user:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
