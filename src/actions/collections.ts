"use server";

import { z } from "zod";

import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  setCollectionFavorite as setCollectionFavoriteQuery,
  type CreateCollectionData,
  type UpdateCollectionData,
  type DashboardCollection,
} from "@/lib/db/collections";

// Server actions for collections. They follow the project's
// { success, data?, error? } result shape and are scoped to the authenticated
// user inside the query layer (requireUserId()), so a session is required.

// Collapses "" / undefined / null to null; otherwise passes the value through.
// Used for the optional, nullable description field.
const emptyToNull = (value: unknown) =>
  value === "" || value == null ? null : value;

// description: optional free text, "" stored as null.
const nullableText = z.preprocess(emptyToNull, z.string().nullable());

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: nullableText,
});

export type CreateCollectionInput = z.input<typeof createCollectionSchema>;

export interface CreateCollectionResult {
  success: boolean;
  data?: DashboardCollection;
  error?: string;
}

// Creates a new collection. Validates with Zod (the source of truth — the client
// only does a basic empty-name guard), then delegates to the query layer, which
// enforces the user scope and returns the new collection's view model.
export async function createCollection(
  input: CreateCollectionInput,
): Promise<CreateCollectionResult> {
  try {
    const parsed = createCollectionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const data: CreateCollectionData = {
      name: parsed.data.name,
      description: parsed.data.description,
    };

    const created = await createCollectionQuery(data);
    return { success: true, data: created };
  } catch (error) {
    console.error("[createCollection] failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: nullableText,
});

export type UpdateCollectionInput = z.input<typeof updateCollectionSchema>;

export interface UpdateCollectionResult {
  success: boolean;
  data?: DashboardCollection;
  error?: string;
}

// Edits a collection's metadata (name/description). Validates with Zod (the
// source of truth), then delegates to the query layer, which enforces the user
// scope and returns the refreshed view model. A null result means the id isn't
// the user's (or doesn't exist) → "Collection not found.".
export async function updateCollection(
  collectionId: string,
  input: UpdateCollectionInput,
): Promise<UpdateCollectionResult> {
  try {
    const parsed = updateCollectionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const data: UpdateCollectionData = {
      name: parsed.data.name,
      description: parsed.data.description,
    };

    const updated = await updateCollectionQuery(collectionId, data);
    if (!updated) {
      return { success: false, error: "Collection not found." };
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("[updateCollection] failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const deleteCollectionSchema = z.object({
  collectionId: z.string().trim().min(1, "Collection id is required"),
});

export interface DeleteCollectionResult {
  success: boolean;
  error?: string;
}

// Deletes a collection. Validates the id with Zod (the source of truth), then
// delegates to the query layer, which enforces ownership. The collection's items
// are preserved — only its membership rows are removed. A false result means the
// id isn't the user's (or doesn't exist) → "Collection not found.".
export async function deleteCollection(
  collectionId: string,
): Promise<DeleteCollectionResult> {
  try {
    const parsed = deleteCollectionSchema.safeParse({ collectionId });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const deleted = await deleteCollectionQuery(parsed.data.collectionId);
    if (!deleted) {
      return { success: false, error: "Collection not found." };
    }

    return { success: true };
  } catch (error) {
    console.error("[deleteCollection] failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

const setCollectionFavoriteSchema = z.object({
  collectionId: z.string().trim().min(1, "Collection id is required"),
  isFavorite: z.boolean(),
});

export interface SetCollectionFavoriteResult {
  success: boolean;
  error?: string;
}

// Toggles a collection's favorite flag. Validates the payload with Zod (the
// source of truth), then delegates to the query layer, which enforces ownership.
// A false result means the id isn't the user's (or doesn't exist) →
// "Collection not found.".
export async function setCollectionFavorite(
  collectionId: string,
  isFavorite: boolean,
): Promise<SetCollectionFavoriteResult> {
  try {
    const parsed = setCollectionFavoriteSchema.safeParse({
      collectionId,
      isFavorite,
    });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const updated = await setCollectionFavoriteQuery(
      parsed.data.collectionId,
      parsed.data.isFavorite,
    );
    if (!updated) {
      return { success: false, error: "Collection not found." };
    }

    return { success: true };
  } catch (error) {
    console.error("[setCollectionFavorite] failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
