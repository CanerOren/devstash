import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { TopBar } from "@/components/dashboard/TopBar";
import { ItemDrawerProvider } from "@/components/items/item-drawer-context";
import { Toaster } from "@/components/ui/sonner";
import { getSidebarItemTypes, toCreatableTypes } from "@/lib/db/items";
import { getSidebarCollections } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";

// The authenticated app shell: a fixed top bar over a sidebar + scrollable main
// area. Shared by every signed-in route (dashboard, profile, …) so they all get
// the same chrome and sidebar data. Reads live per-user data, so the consuming
// route segment must opt into per-request rendering (`export const dynamic`).
export async function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [itemTypes, collections, user] = await Promise.all([
    getSidebarItemTypes(),
    getSidebarCollections(),
    getCurrentUser(),
  ]);

  // The types the "New Item" modal can create (the 5 TEXT/URL system types),
  // derived from the already-fetched sidebar types — no extra query.
  const createTypes = toCreatableTypes(itemTypes);

  return (
    <SidebarProvider>
      {/* Pin the shell to the viewport so only <main> scrolls — the TopBar and
          sidebar stay fixed instead of scrolling out of view. */}
      <div className="flex h-screen flex-col overflow-hidden">
        <TopBar createTypes={createTypes} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar itemTypes={itemTypes} collections={collections} user={user} />
          <main className="flex-1 overflow-y-auto p-6">
            <ItemDrawerProvider>{children}</ItemDrawerProvider>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
