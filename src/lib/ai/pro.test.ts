import { describe, it, expect, vi, beforeEach } from "vitest";

// requireProUser calls requireUserId (→ @/auth) then prisma. Mock both so the
// test exercises only the gate logic — no session or DB.
const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique } },
}));

vi.mock("@/lib/db/helpers", () => ({
  requireUserId: vi.fn(async () => "user_1"),
}));

import { requireProUser } from "@/lib/ai/pro";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireProUser", () => {
  it("returns the userId for a Pro user", async () => {
    findUnique.mockResolvedValue({ isPro: true });

    const result = await requireProUser();

    expect(result).toEqual({ userId: "user_1" });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "user_1" },
      select: { isPro: true },
    });
  });

  it("returns an error for a non-Pro user", async () => {
    findUnique.mockResolvedValue({ isPro: false });

    const result = await requireProUser();

    expect(result).toHaveProperty("error");
    expect(result).not.toHaveProperty("userId");
  });

  it("returns an error when the user is missing", async () => {
    findUnique.mockResolvedValue(null);

    const result = await requireProUser();

    expect(result).toHaveProperty("error");
  });
});
