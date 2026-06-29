import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

// GET /api/items/[id] — full detail for one item, fetched on demand when its
// drawer opens. Requires an authenticated session; the fetcher is scoped to the
// session user, so another user's item resolves to a 404, not their data.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const item = await getItemDetail(id);
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("[items/[id]] failed to load item:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
