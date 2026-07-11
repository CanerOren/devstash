import { describe, it, expect, vi, beforeEach } from "vitest";

// deleteAccount talks to prisma, requireUserId (→ @/auth), resetIdentifier, and
// deleteFromR2ByUrl (→ @aws-sdk). Mock all of them so these tests exercise only
// the action's control flow — no DB, session, or storage. vi.hoisted builds the
// mock fns before the vi.mock factories run.
const {
  userFindUnique,
  itemFindMany,
  transaction,
  verificationTokenDeleteMany,
  userDelete,
  deleteFromR2ByUrl,
} = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  itemFindMany: vi.fn(),
  transaction: vi.fn(),
  verificationTokenDeleteMany: vi.fn(),
  userDelete: vi.fn(),
  deleteFromR2ByUrl: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUnique, delete: userDelete },
    item: { findMany: itemFindMany },
    verificationToken: { deleteMany: verificationTokenDeleteMany },
    $transaction: transaction,
  },
}));

vi.mock("@/lib/db/helpers", () => ({
  requireUserId: vi.fn(async () => "user_1"),
}));

vi.mock("@/lib/auth/password-reset", () => ({
  resetIdentifier: (email: string) => `reset:${email}`,
}));

vi.mock("@/lib/r2", () => ({ deleteFromR2ByUrl }));

import { deleteAccount } from "@/actions/profile";

beforeEach(() => {
  vi.clearAllMocks();
  userFindUnique.mockResolvedValue({ email: "user@example.com" });
  itemFindMany.mockResolvedValue([]);
  transaction.mockResolvedValue(undefined);
  deleteFromR2ByUrl.mockResolvedValue(undefined);
});

describe("deleteAccount", () => {
  it("returns an error and skips deletion when the user isn't found", async () => {
    userFindUnique.mockResolvedValue(null);

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
    expect(deleteFromR2ByUrl).not.toHaveBeenCalled();
  });

  it("scopes the file lookup to the user and only file-backed items", async () => {
    await deleteAccount();

    expect(itemFindMany).toHaveBeenCalledWith({
      where: { userId: "user_1", fileUrl: { not: null } },
      select: { fileUrl: true },
    });
  });

  it("cleans up each uploaded file from R2 after the account is deleted", async () => {
    itemFindMany.mockResolvedValue([
      { fileUrl: "https://cdn/u1/a.pdf" },
      { fileUrl: "https://cdn/u1/b.png" },
    ]);

    const result = await deleteAccount();

    expect(result).toEqual({ success: true });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(deleteFromR2ByUrl).toHaveBeenCalledTimes(2);
    expect(deleteFromR2ByUrl).toHaveBeenCalledWith("https://cdn/u1/a.pdf");
    expect(deleteFromR2ByUrl).toHaveBeenCalledWith("https://cdn/u1/b.png");
  });

  it("makes no R2 calls when the user has no uploaded files", async () => {
    itemFindMany.mockResolvedValue([]);

    const result = await deleteAccount();

    expect(result).toEqual({ success: true });
    expect(deleteFromR2ByUrl).not.toHaveBeenCalled();
  });

  it("still succeeds when an R2 delete rejects (best-effort cleanup)", async () => {
    itemFindMany.mockResolvedValue([{ fileUrl: "https://cdn/u1/a.pdf" }]);
    deleteFromR2ByUrl.mockRejectedValue(new Error("R2 down"));

    const result = await deleteAccount();

    expect(result).toEqual({ success: true });
  });

  it("returns a generic error when the delete transaction throws", async () => {
    transaction.mockRejectedValue(new Error("db down"));

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    expect(deleteFromR2ByUrl).not.toHaveBeenCalled();
  });
});
