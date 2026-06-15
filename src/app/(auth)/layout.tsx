// Shared shell for the unauthenticated auth pages (/sign-in, /register).
// This is a route group: the "(auth)" segment is stripped from the URL, so the
// routes remain /sign-in and /register — it only groups them under one layout.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background">
            DS
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
