"use server";

import { signIn } from "@/auth";

// Server-side GitHub sign-in. Triggered from a <form action={...}> in
// SignInForm. Running signIn on the server lets NextAuth own the redirect,
// avoiding the unreliable client-side redirect timing that required a second
// click. signIn throws a redirect, so this never returns normally.
export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" });
}
