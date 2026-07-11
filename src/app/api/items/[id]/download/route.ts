import { auth } from "@/auth";
import { getItemFileRef } from "@/lib/db/items";
import { getFromR2ByUrl } from "@/lib/r2";

// Node runtime — the AWS S3 client streaming isn't edge-compatible.
export const runtime = "nodejs";

// GET /api/items/[id]/download — streams a FILE item's object back through the
// server with a Content-Disposition: attachment header, so the browser downloads
// it. Proxying avoids the CORS issues of hitting the R2 public URL directly and
// keeps the download behind the session-scoped ownership check (getItemFileRef).
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

    const fileName = item.fileName ?? "download";
    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.ContentType ?? "application/octet-stream",
    );
    // encodeURIComponent handles non-ASCII/spaces in the filename safely.
    headers.set(
      "Content-Disposition",
      `attachment; filename="${fileName.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    if (object.ContentLength != null) {
      headers.set("Content-Length", String(object.ContentLength));
    }

    // The SDK Body is a Node stream; expose it as a web stream for the Response.
    const stream = object.Body.transformToWebStream();
    return new Response(stream, { status: 200, headers });
  } catch (error) {
    console.error("[items/[id]/download] failed:", error);
    return new Response("Something went wrong", { status: 500 });
  }
}
