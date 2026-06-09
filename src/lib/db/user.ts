import { prisma } from "@/lib/prisma";

// No auth yet — the dashboard reads the seeded demo user. Once NextAuth is
// wired up this constant gets replaced by the session user's id.
const DEMO_USER_EMAIL = "demo@devstash.io";

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
