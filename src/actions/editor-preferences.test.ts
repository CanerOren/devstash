import { describe, it, expect, vi, beforeEach } from "vitest";

// updateEditorPreferences talks to prisma and requireUserId (→ @/auth). Mock
// both so these tests exercise only the action's validation + control flow —
// no DB or session. vi.hoisted builds the mock fns before the vi.mock factories.
const { userUpdate } = vi.hoisted(() => ({ userUpdate: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: userUpdate } },
}));

vi.mock("@/lib/db/helpers", () => ({
  requireUserId: vi.fn(async () => "user_1"),
}));

import { updateEditorPreferences } from "@/actions/editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";

beforeEach(() => {
  vi.clearAllMocks();
  userUpdate.mockResolvedValue({});
});

const valid = {
  fontSize: 16,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai" as const,
};

describe("updateEditorPreferences", () => {
  it("persists valid preferences scoped to the user and echoes them back", async () => {
    const result = await updateEditorPreferences(valid);

    expect(result).toEqual({ success: true, data: valid });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { editorPreferences: valid },
    });
  });

  it("accepts the defaults", async () => {
    const result = await updateEditorPreferences(DEFAULT_EDITOR_PREFERENCES);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("rejects an unknown theme without writing to the DB", async () => {
    const result = await updateEditorPreferences({
      ...valid,
      // @ts-expect-error — deliberately invalid theme
      theme: "solarized",
    });

    expect(result.success).toBe(false);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range font size without writing to the DB", async () => {
    const result = await updateEditorPreferences({ ...valid, fontSize: 999 });

    expect(result.success).toBe(false);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("rejects a non-integer tab size without writing to the DB", async () => {
    const result = await updateEditorPreferences({ ...valid, tabSize: 2.5 });

    expect(result.success).toBe(false);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("returns a generic error when the DB write throws", async () => {
    userUpdate.mockRejectedValue(new Error("db down"));

    const result = await updateEditorPreferences(valid);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
