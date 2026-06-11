import { prisma } from "@/lib/prisma";
import { DEMO_USER_EMAIL } from "@/lib/db/helpers";

// View model for the sidebar user area.
export interface SidebarUser {
  name: string | null;
  email: string;
  image: string | null;
}

// The current (demo) user for the sidebar user area.
export async function getCurrentUser(): Promise<SidebarUser> {
  return prisma.user.findUniqueOrThrow({
    where: { email: DEMO_USER_EMAIL },
    select: { name: true, email: true, image: true },
  });
}
