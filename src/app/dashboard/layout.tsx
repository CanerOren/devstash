import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { getSidebarItemTypes } from "@/lib/db/items";
import { getSidebarCollections } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";

// Reads live per-user data for the sidebar, so render on each request rather
// than prerendering at build time. (Becomes implicit once auth reads cookies.)
export const dynamic = "force-dynamic";

// Dashboard shell: fixed top bar over a sidebar + scrollable main area.
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [itemTypes, collections, user] = await Promise.all([
    getSidebarItemTypes(),
    getSidebarCollections(),
    getCurrentUser(),
  ]);

  return (
    <SidebarProvider>
      {/* Pin the shell to the viewport so only <main> scrolls — the TopBar and
          sidebar stay fixed instead of scrolling out of view. */}
      <div className="flex h-screen flex-col overflow-hidden">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            itemTypes={itemTypes}
            collections={collections}
            user={user}
          />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
