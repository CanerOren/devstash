import { describe, it, expect, vi } from "vitest";

// r2.ts reads R2_* env into module-level consts at load and builds public URLs
// from R2_PUBLIC_URL. vi.hoisted runs before the import below, so set the env
// there. We only exercise the pure helpers (no S3 client calls), so the AWS
// credentials don't need to be real.
vi.hoisted(() => {
  process.env.R2_PUBLIC_URL = "https://cdn.example.com";
});

import {
  buildObjectKey,
  publicUrlForKey,
  keyFromFileUrl,
} from "@/lib/r2";

// The uuid segment between the "userId/" prefix and the "-filename" suffix.
const UUID = "[0-9a-f-]{36}";

describe("buildObjectKey", () => {
  it("namespaces the key by user id and lowercases/slugifies the filename", () => {
    const key = buildObjectKey("user_1", "My Photo Final.PNG");
    expect(key).toMatch(new RegExp(`^user_1/${UUID}-my-photo-final\\.png$`));
  });

  it("collapses runs of unsafe characters and trims leading/trailing dashes", () => {
    const key = buildObjectKey("u", "  ***weird!!name.txt  ");
    // Leading junk trimmed; "!!" collapsed to a single dash; extension kept.
    expect(key).toMatch(new RegExp(`^u/${UUID}-weird-name\\.txt$`));
  });

  it("produces a unique key each call for the same input", () => {
    expect(buildObjectKey("u", "a.png")).not.toBe(buildObjectKey("u", "a.png"));
  });
});

describe("publicUrlForKey", () => {
  it("prefixes the key with the public base URL", () => {
    expect(publicUrlForKey("user_1/abc-logo.png")).toBe(
      "https://cdn.example.com/user_1/abc-logo.png",
    );
  });
});

describe("keyFromFileUrl", () => {
  it("recovers the object key from a URL within our bucket (round-trips publicUrlForKey)", () => {
    const key = "user_1/abc-logo.png";
    expect(keyFromFileUrl(publicUrlForKey(key))).toBe(key);
  });

  it("returns null for a URL outside our bucket, so foreign objects aren't deleted", () => {
    expect(keyFromFileUrl("https://evil.example.com/user_1/secret.png")).toBeNull();
    // A URL that merely contains, but doesn't start with, the base is rejected.
    expect(
      keyFromFileUrl("https://attacker.test/?x=https://cdn.example.com/a.png"),
    ).toBeNull();
  });
});
