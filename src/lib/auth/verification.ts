import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

// Email-verification token helpers. Reuses NextAuth's `VerificationToken` table
// (identifier + token + expires) rather than introducing a new model, so no
// migration is needed. Tokens are single-use and time-limited.

export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Single switch for the whole email-verification system. Enabled by default;
// set EMAIL_VERIFICATION_ENABLED="false" to turn it off (e.g. while Resend has
// no verified sending domain, so non-owner addresses can't receive mail). When
// off: registration skips the email and marks accounts verified immediately,
// the sign-in gate is bypassed, and resend no-ops. Read everywhere through this
// one helper so all touchpoints stay in sync.
export function isEmailVerificationEnabled(): boolean {
  return process.env.EMAIL_VERIFICATION_ENABLED !== "false";
}

// Creates a fresh verification token for an email, replacing any existing ones
// for that address (so a resend invalidates the previous link). Returns the
// raw token to embed in the verification URL.
export async function createVerificationToken(email: string): Promise<string> {
  const identifier = email.toLowerCase();
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  return token;
}

// Builds the absolute verification link. `origin` comes from the incoming
// request (so it works in dev and prod without a hardcoded base URL).
export function buildVerificationUrl(origin: string, token: string): string {
  return `${origin}/api/auth/verify-email?token=${token}`;
}

// Issues a verification token and emails the link. Shared by registration and
// the resend endpoint. Returns whether the email was accepted by Resend; never
// throws (callers treat a false as "couldn't send, offer resend").
export async function issueVerificationEmail({
  origin,
  email,
  name,
}: {
  origin: string;
  email: string;
  name: string | null;
}): Promise<boolean> {
  const token = await createVerificationToken(email);
  const url = buildVerificationUrl(origin, token);
  return sendVerificationEmail({ to: email, name, url });
}
