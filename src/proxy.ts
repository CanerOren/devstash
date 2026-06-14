import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Initialize Auth.js with only the edge-safe config (no Prisma adapter) so the
// proxy can run on the edge. It still reads the JWT session to gate routes.
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  if (isOnDashboard && !isLoggedIn) {
    // Send unauthenticated users to NextAuth's default sign-in page.
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
