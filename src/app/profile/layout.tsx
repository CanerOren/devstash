import { AppShell } from "@/components/dashboard/AppShell";

// Reads live per-user data for the sidebar, so render on each request.
export const dynamic = "force-dynamic";

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
