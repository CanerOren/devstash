import { SiteNav } from "@/components/marketing/SiteNav";

// Shared shell for the unauthenticated auth pages (/sign-in, /register,
// /forgot-password, /reset-password). This is a route group: the "(auth)"
// segment is stripped from the URL, so the routes keep their top-level paths —
// it only groups them under one layout.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The same fixed top bar as the marketing homepage; its brand doubles as the
    // way back there. pt-16 clears the nav's height so it can't cover the form.
    <div className="flex min-h-screen flex-col px-4 pb-6 pt-16">
      <SiteNav />
      <main className="flex flex-1 items-center justify-center py-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
