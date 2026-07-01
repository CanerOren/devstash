"use server";

import { z } from "zod";

import {
  updateItem as updateItemQuery,
  deleteItem as deleteItemQuery,
  type ItemDetail,
  type UpdateItemData,
} from "@/lib/db/items";

// Server actions for items. They follow the project's { success, data?, error? }
// result shape and are scoped to the authenticated user inside the query layer
// (requireUserId() + an ownership check), so a session is required.

// Collapses "" / undefined / null to null; otherwise passes the value through.
// Used for the optional, nullable text fields.
const emptyToNull = (value: unknown) =>
  value === "" || value == null ? null : value;

// description / content / language: optional free text, "" stored as null.
const nullableText = z.preprocess(emptyToNull, z.string().nullable());

// url: optional, but must be a valid URL when present (link items).
const nullableUrl = z.preprocess(
  emptyToNull,
  z.union([z.string().url("Enter a valid URL"), z.null()]),
);

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: nullableText,
  content: nullableText,
  url: nullableUrl,
  language: nullableText,
  // Already split/trimmed client-side; trim + drop blanks defensively so a stray
  // empty entry is dropped rather than rejecting the whole payload.
  tags: z
    .array(z.string())
    .default([])
    .transform((arr) => arr.map((tag) => tag.trim()).filter(Boolean)),
});

export type UpdateItemInput = z.input<typeof updateItemSchema>;

export interface UpdateItemResult {
  success: boolean;
  data?: ItemDetail;
  error?: string;
}

// Updates an item's editable fields. Validates the payload with Zod (the source
// of truth — the client only does a basic empty-title guard), then delegates to
// the query layer, which enforces ownership and returns the refreshed detail.
export async function updateItem(
  itemId: string,
  input: UpdateItemInput,
): Promise<UpdateItemResult> {
  try {
    const parsed = updateItemSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const data: UpdateItemData = {
      title: parsed.data.title,
      description: parsed.data.description,
      content: parsed.data.content,
      url: parsed.data.url,
      language: parsed.data.language,
      // Dedupe so two identical tags don't collide on the ItemTag composite key.
      tags: [...new Set(parsed.data.tags)],
    };

    const updated = await updateItemQuery(itemId, data);
    if (!updated) {
      return { success: false, error: "Item not found." };
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("[updateItem] failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const deleteItemSchema = z.object({
  itemId: z.string().trim().min(1, "Item id is required"),
});

export interface DeleteItemResult {
  success: boolean;
  error?: string;
}

// Deletes an item. Validates the id with Zod (the source of truth), then
// delegates to the query layer, which enforces ownership. A false result means
// the item isn't the user's (or doesn't exist) → "Item not found.".
export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  try {
    const parsed = deleteItemSchema.safeParse({ itemId });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const deleted = await deleteItemQuery(parsed.data.itemId);
    if (!deleted) {
      return { success: false, error: "Item not found." };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteItem] failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
