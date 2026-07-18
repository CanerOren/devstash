import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/db/helpers";

// Server-side Pro gate for AI features. This is the real enforcement — the UI
// hiding of AI buttons for free users is only complementary. AI features are
// Pro-only per the monetization table.
//
// Returns the userId on success, or a `{ error }` the calling action can return
// directly in its { success, error } shape.

export type ProGateResult = { userId: string } | { error: string };

export async function requireProUser(): Promise<ProGateResult> {
  // Throws if unauthenticated (routes are already auth-gated by proxy.ts); the
  // action's try/catch maps that to a generic error.
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  if (!user?.isPro) {
    return { error: "AI features are available on the Pro plan." };
  }

  return { userId };
}
