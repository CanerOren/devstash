import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isEmailVerificationEnabled } from "@/lib/auth/verification";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import authConfig from "@/auth.config";

// Thrown when credentials are valid but the email hasn't been verified yet.
// The `code` is surfaced to the client by signIn() so the UI can show a
// "verify your email" message (with a resend option) instead of the generic
// "invalid credentials" error. See SignInForm.
class EmailNotVerifiedError extends CredentialsSignin {
  code = "unverified";
}

// Thrown when too many sign-in attempts come from the same IP + email. The
// `code` lets SignInForm show a "try again later" message. The login route
// (/api/auth/callback/credentials) is owned by NextAuth, so we rate-limit here
// inside authorize — where we have both the email and the request headers —
// rather than wrapping the route.
class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

// Full config: spreads the edge-safe providers and adds the Prisma adapter plus
// the JWT session strategy (required when splitting config for edge runtimes).
// Import this throughout the app (server components, actions, route handlers) —
// everywhere except the proxy, which must stay edge-compatible.
//
// The Credentials placeholder from auth.config.ts (authorize → null) is replaced
// here with the real implementation: look up the user by email and verify the
// bcrypt-hashed password. OAuth-only users have a null password and are rejected.
const credentialsProvider = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials, request) {
    const email = credentials?.email;
    const password = credentials?.password;
    if (typeof email !== "string" || typeof password !== "string") {
      return null;
    }

    // Throttle brute-force / credential-stuffing by IP + email before touching
    // the DB or bcrypt. Fails open if Upstash is unavailable.
    const rateLimit = await checkRateLimit(
      "login",
      `${getClientIp(request)}:${email.toLowerCase()}`,
    );
    if (!rateLimit.success) {
      throw new RateLimitedError();
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user?.password) {
      return null;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return null;
    }

    // Block sign-in until the email is verified, unless verification is disabled
    // globally. GitHub OAuth users never reach this provider, so they are
    // unaffected either way.
    if (isEmailVerificationEnabled() && !user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    return { id: user.id, name: user.name, email: user.email, image: user.image };
  },
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: authConfig.providers.map((provider) =>
    typeof provider !== "function" && provider.id === "credentials"
      ? credentialsProvider
      : provider,
  ),
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
