"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/db/helpers";
import { resetIdentifier } from "@/lib/auth/password-reset";
import { deleteFromR2ByUrl } from "@/lib/r2";

// Server actions for the profile page. Both follow the project's
// { success, error? } result shape and are scoped to the authenticated user
// via requireUserId() (which throws if there's no session).

// Password rules mirror registration / reset-password (8–72 chars + confirm).
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(72, "New password must be at most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export interface ActionResult {
  success: boolean;
  error?: string;
}

// Change the signed-in user's password. Requires the current password and is
// only valid for email/password accounts — GitHub OAuth-only users (null hash)
// are rejected.
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  try {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const userId = await requireUserId();
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.password) {
      return {
        success: false,
        error: "Password change isn't available for accounts that sign in with GitHub.",
      };
    }

    const { currentPassword, newPassword } = parsed.data;

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return { success: false, error: "Your current password is incorrect." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    });

    return { success: true };
  } catch (error) {
    console.error("[changePassword] failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Permanently delete the signed-in user's account. The schema's onDelete:
// Cascade removes their items, collections, tags, sessions, and OAuth accounts;
// we also clear any leftover verification / reset tokens (keyed by email, so
// they don't cascade). The backing R2 objects for the user's FILE/IMAGE items
// don't cascade, so they're removed best-effort after the row delete (mirroring
// deleteItem) — a storage hiccup won't fail the account deletion. The caller
// signs the user out afterward.
export async function deleteAccount(): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return { success: false, error: "Account not found." };
    }

    // Collect the user's uploaded file URLs before deleting the rows, so we can
    // clean up R2 afterward (the DB cascade won't touch object storage).
    const fileItems = await prisma.item.findMany({
      where: { userId, fileUrl: { not: null } },
      select: { fileUrl: true },
    });

    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: { identifier: { in: [user.email, resetIdentifier(user.email)] } },
      }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    // Best-effort R2 cleanup after the account is gone. deleteFromR2ByUrl
    // swallows its own errors; allSettled guards against any that don't so a
    // failed object delete never turns a successful account deletion into an error.
    await Promise.allSettled(
      fileItems.map(({ fileUrl }) => deleteFromR2ByUrl(fileUrl!)),
    );

    return { success: true };
  } catch (error) {
    console.error("[deleteAccount] failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
