"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/db/helpers";
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/editor-preferences";

// Server action for the editor-preferences settings section. Follows the
// project's { success, data?, error? } shape and is scoped to the authenticated
// user via requireUserId() (throws without a session).

export interface UpdateEditorPreferencesResult {
  success: boolean;
  data?: EditorPreferences;
  error?: string;
}

// Persist the signed-in user's editor preferences. The client auto-saves the
// full preferences object on every change (debounced), so this replaces the
// stored value wholesale. Zod is the source of truth for validity.
export async function updateEditorPreferences(
  input: EditorPreferences,
): Promise<UpdateEditorPreferencesResult> {
  try {
    const parsed = editorPreferencesSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid preferences",
      };
    }

    const userId = await requireUserId();

    await prisma.user.update({
      where: { id: userId },
      data: { editorPreferences: parsed.data },
    });

    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("[updateEditorPreferences] failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
