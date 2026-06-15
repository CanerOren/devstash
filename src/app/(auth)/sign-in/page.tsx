import { Suspense } from "react";
import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in · DevStash",
};

export default function SignInPage() {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Sign in to DevStash
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome back — pick up where you left off.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* SignInForm reads search params (callbackUrl, registered, error). */}
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </>
  );
}
