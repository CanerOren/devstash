"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitHubIcon } from "@/components/auth/GitHubIcon";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  // After registering, RegisterForm sends users here with ?registered=1.
  const justRegistered = searchParams.get("registered") === "1";
  // ?verify=0 means verification is disabled — the account is ready to use, so
  // skip the "check your email" wording.
  const verificationRequired = searchParams.get("verify") !== "0";
  // The verify-email route redirects back here after a click on the link.
  const justVerified = searchParams.get("verified") === "1";
  const verifyError = searchParams.get("verifyError");
  // NextAuth redirects back here with ?error=... when an OAuth sign-in fails.
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // True once a sign-in attempt is blocked because the email isn't verified —
  // unlocks the "resend verification email" affordance.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const verifyErrorMessage =
    verifyError === "expired"
      ? "That verification link has expired. Sign in to get a new one sent."
      : verifyError === "invalid"
        ? "That verification link is invalid or has already been used."
        : null;

  // Show the form's own (credentials) error if present, otherwise a verify-link
  // error, otherwise any OAuth error carried in the URL.
  const error =
    formError ??
    verifyErrorMessage ??
    (oauthError ? "Could not sign in with GitHub. Please try again." : null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setNeedsVerification(false);
    setResendState("idle");
    setPending(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setPending(false);
      if (result?.code === "unverified") {
        setNeedsVerification(true);
        setFormError("Please verify your email before signing in.");
      } else {
        setFormError("Invalid email or password.");
      }
      return;
    }

    // Full navigation so the new session is picked up by server components.
    router.push(callbackUrl);
    router.refresh();
  }

  async function onResend() {
    setResendState("sending");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // The endpoint intentionally returns a generic response; ignore failures.
    }
    setResendState("sent");
  }

  return (
    <div className="space-y-4">
      {justVerified && !error && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          Email verified. You can now sign in.
        </p>
      )}
      {justRegistered && !justVerified && !error && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
          {verificationRequired
            ? "Account created. Check your email for a verification link before signing in."
            : "Account created. You can now sign in."}
        </p>
      )}
      {error && (
        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p>{error}</p>
          {needsVerification &&
            (resendState === "sent" ? (
              <p className="text-muted-foreground">
                Verification email sent. Check your inbox.
              </p>
            ) : (
              <button
                type="button"
                onClick={onResend}
                disabled={resendState === "sending" || !email}
                className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-60"
              >
                {resendState === "sending" ? "Sending…" : "Resend verification email"}
              </button>
            ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() => signIn("github", { callbackUrl })}
      >
        <GitHubIcon />
        Sign in with GitHub
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
