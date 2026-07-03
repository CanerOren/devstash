// Cloudflare R2 storage helper. R2 is S3-compatible, so we use the AWS S3 client
// pointed at the account's R2 endpoint. Server-only — imported by the upload /
// download API routes and the item delete flow. Never import from client code.

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME;
// Public base URL for the bucket (used to build stored fileUrls + serve images).
const PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

// True when every R2 env var is present. The upload route checks this so a
// misconfigured deploy returns a clear error instead of a cryptic SDK crash.
export function isR2Configured(): boolean {
  return Boolean(
    ACCOUNT_ID &&
      ACCESS_KEY_ID &&
      SECRET_ACCESS_KEY &&
      BUCKET &&
      PUBLIC_URL,
  );
}

let client: S3Client | null = null;

// Lazily built, cached S3 client for R2. Throws if the env isn't configured
// (callers should gate on isR2Configured() first for a friendly error).
function r2(): S3Client {
  if (client) return client;
  if (!isR2Configured()) {
    throw new Error("R2 is not configured (missing R2_* environment variables)");
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID!,
      secretAccessKey: SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

// Slugifies an original filename for use in an object key: keeps the extension,
// lowercases, and replaces anything unsafe with a dash.
function safeName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Builds a collision-free object key for a user's upload, namespaced by user id.
export function buildObjectKey(userId: string, fileName: string): string {
  return `${userId}/${crypto.randomUUID()}-${safeName(fileName)}`;
}

// The stored public URL for an object key.
export function publicUrlForKey(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

// Recovers the object key from a stored fileUrl (the inverse of publicUrlForKey).
// Returns null when the URL doesn't belong to our bucket, so callers don't try
// to delete something outside it.
export function keyFromFileUrl(fileUrl: string): string | null {
  if (!PUBLIC_URL || !fileUrl.startsWith(`${PUBLIC_URL}/`)) return null;
  return fileUrl.slice(PUBLIC_URL.length + 1);
}

// Uploads a file buffer to R2 and returns its public URL.
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await r2().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return publicUrlForKey(key);
}

// Deletes an object from R2 by its stored fileUrl. Best-effort: returns false
// (rather than throwing) when the URL isn't ours or the delete fails, so an item
// delete isn't blocked by a storage hiccup.
export async function deleteFromR2ByUrl(fileUrl: string): Promise<boolean> {
  const key = keyFromFileUrl(fileUrl);
  if (!key) return false;
  try {
    await r2().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (error) {
    console.error("[r2] failed to delete object:", error);
    return false;
  }
}

// Fetches an object from R2 for the download proxy (streams it back through the
// server to avoid CORS). Returns the raw SDK output (Body + metadata).
export async function getFromR2ByUrl(
  fileUrl: string,
): Promise<GetObjectCommandOutput | null> {
  const key = keyFromFileUrl(fileUrl);
  if (!key) return null;
  return r2().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
}
