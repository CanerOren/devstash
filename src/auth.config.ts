import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

// Edge-compatible config: providers only, no adapter (the Prisma adapter is not
// edge-safe, so it lives in auth.ts). This file is imported by the proxy to
// lazily initialize Auth.js without a database connection.
// GitHub reads AUTH_GITHUB_ID / AUTH_GITHUB_SECRET from the environment.
export default {
  providers: [GitHub],
} satisfies NextAuthConfig;
