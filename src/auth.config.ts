import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Edge-compatible config: providers only, no adapter (the Prisma adapter is not
// edge-safe, so it lives in auth.ts). This file is imported by the proxy to
// lazily initialize Auth.js without a database connection.
// GitHub reads AUTH_GITHUB_ID / AUTH_GITHUB_SECRET from the environment.
//
// The Credentials provider here is a PLACEHOLDER: its `authorize` always returns
// null. The real bcrypt + Prisma validation can't run on the edge, so auth.ts
// overrides this provider with the working implementation. The `credentials`
// field shape is kept here so the default /api/auth/signin form still renders.
export default {
  // Route Auth.js's sign-in flow (and error redirects) to our custom page
  // instead of the default /api/auth/signin form.
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;
