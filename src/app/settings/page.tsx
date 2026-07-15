import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getProfileUser } from "@/lib/db/user";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";

// Reads the authenticated user's data, so render per request.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Defense in depth — the proxy already gates /settings, but guard here too so a
  // missing session redirects cleanly instead of throwing in the fetchers.
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/settings");
  }

  const user = await getProfileUser();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings
        </p>
      </header>

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
