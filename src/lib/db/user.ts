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
