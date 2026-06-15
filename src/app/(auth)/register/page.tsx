import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create account · DevStash",
};

export default function RegisterPage() {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Create your DevStash account
        </h1>
        <p className="text-sm text-muted-foreground">
          One hub for all your dev knowledge.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <RegisterForm />
      </div>
    </>
  );
}
