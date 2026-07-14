"use server";

import { z } from "zod";

import {
  createCollection as createCollectionQuery,
  type CreateCollectionData,
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
