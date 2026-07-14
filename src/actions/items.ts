"use server";

import { z } from "zod";

import {
  createItem as createItemQuery,
  updateItem as updateItemQuery,
  deleteItem as deleteItemQuery,
  type ItemDetail,
  type CreateItemData,
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

// All 7 creatable types. TEXT/URL types use the plain fields; file/image carry
// R2 object metadata (fileUrl/fileName/fileSize) from the upload route.
const CREATABLE_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
  "file",
  "image",
] as const;
// Which types keep a `content` body, which keep a `language`, and which are
// file-backed, per the spec.
const CONTENT_TYPE_NAMES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPE_NAMES = new Set(["snippet", "command"]);
const FILE_TYPE_NAMES = new Set(["file", "image"]);

const createItemSchema = z
  .object({
    type: z.enum(CREATABLE_TYPES),
    title: z.string().trim().min(1, "Title is required"),
    description: nullableText,
    content: nullableText,
    url: nullableUrl,
    language: nullableText,
    fileUrl: nullableUrl,
    fileName: nullableText,
    fileSize: z.preprocess(
      (v) => (v === "" || v == null ? null : v),
      z.union([z.number().int().nonnegative(), z.null()]),
    ),
    tags: z
      .array(z.string())
      .default([])
      .transform((arr) => arr.map((tag) => tag.trim()).filter(Boolean)),
    collectionIds: z
      .array(z.string())
      .default([])
      .transform((arr) => arr.map((id) => id.trim()).filter(Boolean)),
  })
  // Links must carry a URL (nullableUrl already validated the format when present).
  .refine((data) => data.type !== "link" || data.url !== null, {
    message: "URL is required",
    path: ["url"],
  })
  // File/image items must have an uploaded file.
  .refine((data) => !FILE_TYPE_NAMES.has(data.type) || data.fileUrl !== null, {
    message: "A file is required",
    path: ["fileUrl"],
  });

// `type` is widened to string so callers (the client dialog's type state) don't
// need to pre-narrow it — the Zod enum is the runtime gate that rejects anything
// outside the creatable types.
export type CreateItemInput = Omit<z.input<typeof createItemSchema>, "type"> & {
  type: string;
};

export interface CreateItemResult {
  success: boolean;
  data?: ItemDetail;
  error?: string;
}

// Creates a new item of one of the creatable types (all 7 system types).
// Validates with Zod (the source of truth), nulls out fields that don't apply to
// the chosen type (so a value typed before switching type isn't persisted), then
// delegates to the query layer, which resolves the type + derives contentType and
// enforces the user scope. A null result means the system type is missing
// (unseeded DB).
export async function createItem(
  input: CreateItemInput,
): Promise<CreateItemResult> {
  try {
    const parsed = createItemSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const { type } = parsed.data;
    const isFileType = FILE_TYPE_NAMES.has(type);
    const data: CreateItemData = {
      typeName: type,
      title: parsed.data.title,
      description: parsed.data.description,
      content: CONTENT_TYPE_NAMES.has(type) ? parsed.data.content : null,
      url: type === "link" ? parsed.data.url : null,
      language: LANGUAGE_TYPE_NAMES.has(type) ? parsed.data.language : null,
      fileUrl: isFileType ? parsed.data.fileUrl : null,
      fileName: isFileType ? parsed.data.fileName : null,
      fileSize: isFileType ? parsed.data.fileSize : null,
      // Dedupe so two identical tags don't collide on the ItemTag composite key.
      tags: [...new Set(parsed.data.tags)],
      // Dedupe so two identical ids don't collide on the ItemCollection key.
      collectionIds: [...new Set(parsed.data.collectionIds)],
    };

    const created = await createItemQuery(data);
    if (!created) {
      return { success: false, error: "Could not create item." };
    }

    return { success: true, data: created };
  } catch (error) {
    console.error("[createItem] failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

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
  collectionIds: z
    .array(z.string())
    .default([])
    .transform((arr) => arr.map((id) => id.trim()).filter(Boolean)),
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
      // Dedupe so two identical ids don't collide on the ItemCollection key.
      collectionIds: [...new Set(parsed.data.collectionIds)],
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
