import { createElement } from "react";
import { redirect } from "next/navigation";
import { Boxes, Calendar, FolderOpen, Mail } from "lucide-react";

import { auth } from "@/auth";
import { getProfileUser } from "@/lib/db/user";
import { getItemStats, getSidebarItemTypes } from "@/lib/db/items";
import { getCollectionStats } from "@/lib/db/collections";
import { UserAvatar } from "@/components/user/UserAvatar";
import { getTypeIcon } from "@/components/dashboard/type-icons";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";

// Reads the authenticated user's data, so render per request.
export const dynamic = "force-dynamic";

// Formats a date as "June 8, 2026".
function formatJoinDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ProfilePage() {
  // Defense in depth — the proxy already gates /profile, but guard here too so a
  // missing session redirects cleanly instead of throwing in the fetchers.
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/profile");
  }

  const [user, itemStats, collectionStats, itemTypes] = await Promise.all([
    getProfileUser(),
    getItemStats(),
    getCollectionStats(),
    getSidebarItemTypes(),
  ]);

  const displayName = user.name ?? user.email;
  const provider = user.hasPassword
    ? "Email & password account"
    : "Signed in with GitHub";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          View your account information and usage
        </p>
      </header>

      {/* Account Information */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-5 text-lg font-semibold">Account Information</h2>

        <div className="flex items-center gap-4">
          <UserAvatar
            name={displayName}
            image={user.image}
            size="lg"
            className="size-16"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{provider}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Email:</span>
            <span className="truncate font-medium">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Member since:</span>
            <span className="font-medium">{formatJoinDate(user.createdAt)}</span>
          </div>
        </div>
      </section>

      {/* Usage Statistics */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-5 text-lg font-semibold">Usage Statistics</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#3b82f6]/10">
              <Boxes className="size-5 text-[#3b82f6]" />
            </span>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {itemStats.total}
              </p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#8b5cf6]/10">
              <FolderOpen className="size-5 text-[#8b5cf6]" />
            </span>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {collectionStats.total}
              </p>
              <p className="text-sm text-muted-foreground">Collections</p>
            </div>
          </div>
        </div>

        {/* Breakdown by item type */}
        <p className="mt-6 mb-3 text-sm font-medium">Items by Type</p>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {itemTypes.map((type) => (
            <li
              key={type.id}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            >
              {createElement(getTypeIcon(type.icon), {
                className: "size-4 shrink-0",
                style: { color: type.color },
              })}
              <span className="flex-1 truncate text-muted-foreground">
                {type.label}
              </span>
              <span className="font-semibold tabular-nums">{type.count}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Account Settings */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-5 text-lg font-semibold">Account Settings</h2>

        <div className="space-y-4">
          {user.hasPassword && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Change password</p>
                <p className="text-sm text-muted-foreground">
                  Update the password you use to sign in.
                </p>
              </div>
              <ChangePasswordDialog />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-destructive">
                Delete account
              </p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all of your data.
              </p>
            </div>
            <DeleteAccountDialog />
          </div>
        </div>
      </section>
    </div>
  );
}
