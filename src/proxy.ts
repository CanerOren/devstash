import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Initialize Auth.js with only the edge-safe config (no Prisma adapter) so the
// proxy can run on the edge. It still reads the JWT session to gate routes.
const { auth } = NextAuth(authConfig);

// Routes that require an authenticated session.
const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/items", "/collections"];

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    req.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !isLoggedIn) {
    // Send unauthenticated users to our custom sign-in page, preserving where
    // they were headed so we can return them there after a successful sign-in.
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/items/:path*",
    "/collections/:path*",
  ],
};
