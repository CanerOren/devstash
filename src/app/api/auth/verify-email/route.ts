import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/verify-email?token=... — confirms a user's email address.
// Validates the single-use token, marks the user verified, consumes the token,
// and redirects back to the sign-in page with a status the UI can surface.
//
// Outcomes (as ?query on /sign-in):
//   verified=1               → success (or already verified)
//   verifyError=invalid      → token missing/unknown
//   verifyError=expired      → token past its expiry
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const redirectTo = (params: string) =>
    NextResponse.redirect(new URL(`/sign-in?${params}`, url.origin));

  if (!token) {
    return redirectTo("verifyError=invalid");
  }

  try {
    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record) {
      return redirectTo("verifyError=invalid");
    }

    // Always consume the token now — whether it's valid or expired it's done.
    await prisma.verificationToken.delete({ where: { token } });

    if (record.expires < new Date()) {
      return redirectTo("verifyError=expired");
    }

    // Mark verified (idempotent: re-verifying an already-verified user is fine).
    await prisma.user.updateMany({
      where: { email: record.identifier, emailVerified: null },
      data: { emailVerified: new Date() },
    });

    return redirectTo("verified=1");
  } catch (error) {
    console.error("[verify-email] failed to verify token:", error);
    return redirectTo("verifyError=invalid");
  }
}
