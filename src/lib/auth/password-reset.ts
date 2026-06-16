import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

// Password-reset token helpers. Reuses NextAuth's `VerificationToken` table
// (identifier + token + expires) rather than introducing a new model, so no
// migration is needed. Tokens are single-use and time-limited.
//
// Email-verification tokens live in the same table keyed by the plain email, so
// reset tokens are namespaced with a `reset:` prefix on the identifier. This
// keeps the two flows isolated: issuing a reset never wipes a pending
// verification token, and a reset token can't be accepted by /verify-email
// (nor a verification token by /reset-password).

export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
export const RESET_IDENTIFIER_PREFIX = "reset:";

// Builds the namespaced identifier stored in VerificationToken for resets.
export function resetIdentifier(email: string): string {
  return `${RESET_IDENTIFIER_PREFIX}${email.toLowerCase()}`;
}

// Recovers the email from a reset identifier, or null if it isn't a reset token.
export function emailFromResetIdentifier(identifier: string): string | null {
  return identifier.startsWith(RESET_IDENTIFIER_PREFIX)
    ? identifier.slice(RESET_IDENTIFIER_PREFIX.length)
    : null;
}

// Creates a fresh reset token for an email, replacing any existing reset tokens
// for that address (so a re-request invalidates the previous link). Returns the
// raw token to embed in the reset URL.
export async function createPasswordResetToken(email: string): Promise<string> {
  const identifier = resetIdentifier(email);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  return token;
}

// Builds the absolute reset link. Points at the /reset-password page (not an API
// route — the user needs a form to enter a new password). `origin` comes from
// the incoming request, so it works in dev and prod without a hardcoded base URL.
export function buildPasswordResetUrl(origin: string, token: string): string {
  return `${origin}/reset-password?token=${token}`;
}

// Issues a reset token and emails the link. Returns whether the email was
// accepted by Resend; never throws.
export async function issuePasswordResetEmail({
  origin,
  email,
  name,
}: {
  origin: string;
  email: string;
  name: string | null;
}): Promise<boolean> {
  const token = await createPasswordResetToken(email);
  const url = buildPasswordResetUrl(origin, token);
  return sendPasswordResetEmail({ to: email, name, url });
}
