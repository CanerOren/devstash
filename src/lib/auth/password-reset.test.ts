import { describe, it, expect, vi } from "vitest";

// The module under test imports @/lib/prisma (which throws at load time if
// DATABASE_URL is unset) and @/lib/email (which builds a Resend client). Mock
// both so these pure-function tests need no DB or env. vi.mock is hoisted above
// the import below, so the real modules never load.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/email", () => ({ sendPasswordResetEmail: vi.fn() }));

import {
  resetIdentifier,
  emailFromResetIdentifier,
  buildPasswordResetUrl,
  RESET_IDENTIFIER_PREFIX,
} from "@/lib/auth/password-reset";

describe("resetIdentifier", () => {
  it("namespaces the email with the reset prefix", () => {
    expect(resetIdentifier("user@example.com")).toBe(
      `${RESET_IDENTIFIER_PREFIX}user@example.com`,
    );
  });

  it("lowercases the email so lookups are case-insensitive", () => {
    expect(resetIdentifier("User@Example.COM")).toBe(
      `${RESET_IDENTIFIER_PREFIX}user@example.com`,
    );
  });
});

describe("emailFromResetIdentifier", () => {
  it("recovers the email from a reset identifier (round-trips resetIdentifier)", () => {
    const email = "user@example.com";
    expect(emailFromResetIdentifier(resetIdentifier(email))).toBe(email);
  });

  it("returns null for a non-reset identifier (a plain verification token)", () => {
    // Security-relevant: keeps the verification and reset token namespaces
    // isolated, so a verification token can't be consumed as a reset token.
    expect(emailFromResetIdentifier("user@example.com")).toBeNull();
  });
});

describe("buildPasswordResetUrl", () => {
  it("builds the reset-page link with the token as a query param", () => {
    expect(buildPasswordResetUrl("https://app.example.com", "abc123")).toBe(
      "https://app.example.com/reset-password?token=abc123",
    );
  });
});
