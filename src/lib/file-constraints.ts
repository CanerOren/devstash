// File-upload constraints for the two Pro-only item types (file & image), shared
// by the upload API route (server-side validation) and the FileUpload component
// (client accept filter + pre-upload guard). Pure logic — no I/O — so it's unit
// tested in file-constraints.test.ts.

// The two categories map 1:1 to the "image" and "file" system item type names.
export type FileCategory = "image" | "file";

export interface FileConstraint {
  maxSize: number; // bytes
  extensions: string[]; // lowercased, dot-prefixed
  mimeTypes: string[]; // allowed Content-Types (used for the accept filter)
}

const MB = 1024 * 1024;

export const FILE_CONSTRAINTS: Record<FileCategory, FileConstraint> = {
  image: {
    maxSize: 5 * MB,
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    mimeTypes: [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
  },
  file: {
    maxSize: 10 * MB,
    extensions: [
      ".pdf",
      ".txt",
      ".md",
      ".json",
      ".yaml",
      ".yml",
      ".xml",
      ".csv",
      ".toml",
      ".ini",
    ],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
};

// Type guard: is this raw item-type name an upload category?
export function isFileCategory(name: string): name is FileCategory {
  return name === "image" || name === "file";
}

// The lowercased extension of a filename, including the dot (e.g. ".png"), or ""
// when there's no extension.
export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return ""; // no dot, or a leading dot (dotfile) → no extension
  return fileName.slice(dot).toLowerCase();
}

// Human-readable byte count, e.g. 5 * 1024 * 1024 → "5 MB".
export function formatMaxSize(bytes: number): string {
  return `${Math.round(bytes / MB)} MB`;
}

// The `accept` attribute value for a file input of this category — the allowed
// extensions and MIME types, comma-separated.
export function acceptAttribute(category: FileCategory): string {
  const { extensions, mimeTypes } = FILE_CONSTRAINTS[category];
  return [...extensions, ...mimeTypes].join(",");
}

export interface ValidatedFile {
  name: string;
  size: number;
}

// Validates a file against its category's extension and size limits. Extension
// is the authoritative check (browser-reported MIME types are unreliable for
// text formats like .md/.toml/.ini). Returns an error message, or null when OK.
export function validateFile(
  file: ValidatedFile,
  category: FileCategory,
): string | null {
  const { maxSize, extensions } = FILE_CONSTRAINTS[category];

  const ext = fileExtension(file.name);
  if (!ext || !extensions.includes(ext)) {
    return `Unsupported file type. Allowed: ${extensions.join(", ")}`;
  }

  if (file.size <= 0) {
    return "File is empty.";
  }

  if (file.size > maxSize) {
    return `File is too large. Maximum size is ${formatMaxSize(maxSize)}.`;
  }

  return null;
}
