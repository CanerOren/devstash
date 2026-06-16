import { Suspense } from "react";
import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password · DevStash",
};

export default function ResetPasswordPage() {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a strong password you don&apos;t use elsewhere.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* ResetPasswordForm reads the ?token= search param. */}
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </>
  );
}
