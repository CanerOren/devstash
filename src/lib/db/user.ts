import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/db/helpers";

// View model for the sidebar user area.
export interface SidebarUser {
  name: string | null;
  email: string;
  image: string | null;
}

// The currently authenticated user for the sidebar user area. Loads fresh
// name/email/image from the DB (by the session user id) so updates are
// reflected. Only called on the auth-gated /dashboard routes.
export async function getCurrentUser(): Promise<SidebarUser> {
  const userId = await requireUserId();

  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });
}

// View model for the profile page header.
export interface ProfileUser {
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  // True when the user signed up with email/password (has a hash). Drives the
  // "Change password" section, which is hidden for GitHub OAuth-only users.
  // The hash itself is never exposed — only this boolean.
  hasPassword: boolean;
}

// The currently authenticated user for the profile page. Like getCurrentUser
// but also returns the join date and whether a password is set. Only called on
// the auth-gated /profile route.
export async function getProfileUser(): Promise<ProfileUser> {
  const userId = await requireUserId();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
    },
  });

  const { password, ...rest } = user;
  return { ...rest, hasPassword: password !== null };
}
