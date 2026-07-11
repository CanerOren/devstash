import { auth } from "@/auth";
import { getItemFileRef } from "@/lib/db/items";
import { getFromR2ByUrl } from "@/lib/r2";

// Node runtime — the AWS S3 client streaming isn't edge-compatible.
export const runtime = "nodejs";

// GET /api/items/[id]/image — streams a FILE item's object back through the
// server for inline display (e.g. gallery thumbnails, the drawer preview).
// Serving via the S3 API endpoint avoids the flaky/rate-limited R2 public
// `r2.dev` URL, and keeps the image behind the session-scoped ownership check.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const item = await getItemFileRef(id);
    if (!item || item.contentType !== "FILE" || !item.fileUrl) {
      return new Response("Not found", { status: 404 });
    }

    const object = await getFromR2ByUrl(item.fileUrl);
    if (!object?.Body) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.ContentType ?? "application/octet-stream",
    );
    headers.set("Content-Disposition", "inline");
    // Prevent the browser from MIME-sniffing and honor the stored type exactly.
    // Uploaded SVGs are served inline, so this stops an embedded <script> from
    // executing on direct navigation to this URL.
    headers.set("X-Content-Type-Options", "nosniff");
    if (object.ContentLength != null) {
      headers.set("Content-Length", String(object.ContentLength));
    }
    // The object is immutable (keyed by a UUID; editing an item never replaces
    // the file), so it's safe for the browser to cache aggressively per-user.
    headers.set("Cache-Control", "private, max-age=86400, immutable");

    // The SDK Body is a Node stream; expose it as a web stream for the Response.
    const stream = object.Body.transformToWebStream();
    return new Response(stream, { status: 200, headers });
  } catch (error) {
    console.error("[items/[id]/image] failed:", error);
    return new Response("Something went wrong", { status: 500 });
  }
}
