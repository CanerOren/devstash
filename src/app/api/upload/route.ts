import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { buildObjectKey, isR2Configured, uploadToR2 } from "@/lib/r2";
import { isFileCategory, validateFile } from "@/lib/file-constraints";

// Node runtime — the AWS S3 client and Buffer aren't edge-compatible.
export const runtime = "nodejs";

// POST /api/upload — uploads a file/image to R2 and returns its metadata
// ({ fileUrl, fileName, fileSize }) for the create-item form to persist. The
// item itself is created separately by the createItem server action. Requires an
// authenticated session; file/image are the two Pro-only types, but Pro gating
// is a separate concern (dev users are all Pro).
//
// multipart/form-data body:
//   - file:     the uploaded File
//   - category: "image" | "file" (matches the item type name)
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { success: false, error: "File storage is not configured." },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const category = formData.get("category");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided." },
        { status: 400 },
      );
    }

    if (typeof category !== "string" || !isFileCategory(category)) {
      return NextResponse.json(
        { success: false, error: "Invalid upload category." },
        { status: 400 },
      );
    }

    // Authoritative server-side validation (the client validates too, for UX).
    const validationError = validateFile(
      { name: file.name, size: file.size },
      category,
    );
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = buildObjectKey(userId, file.name);
    const contentType = file.type || "application/octet-stream";
    const fileUrl = await uploadToR2(key, buffer, contentType);

    return NextResponse.json({
      success: true,
      data: { fileUrl, fileName: file.name, fileSize: file.size },
    });
  } catch (error) {
    console.error("[upload] failed:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
