import { describe, it, expect } from "vitest";

import {
  fileExtension,
  formatFileSize,
  formatMaxSize,
  isFileCategory,
  validateFile,
  FILE_CONSTRAINTS,
} from "@/lib/file-constraints";

describe("isFileCategory", () => {
  it("accepts the two upload categories", () => {
    expect(isFileCategory("image")).toBe(true);
    expect(isFileCategory("file")).toBe(true);
  });

  it("rejects any other type name", () => {
    expect(isFileCategory("snippet")).toBe(false);
    expect(isFileCategory("")).toBe(false);
  });
});

describe("fileExtension", () => {
  it("returns the lowercased extension including the dot", () => {
    expect(fileExtension("Logo.PNG")).toBe(".png");
    expect(fileExtension("archive.tar.gz")).toBe(".gz");
  });

  it("returns empty for no extension or a dotfile", () => {
    expect(fileExtension("README")).toBe("");
    expect(fileExtension(".gitignore")).toBe("");
  });
});

describe("formatMaxSize", () => {
  it("formats byte limits as whole MB", () => {
    expect(formatMaxSize(FILE_CONSTRAINTS.image.maxSize)).toBe("5 MB");
    expect(formatMaxSize(FILE_CONSTRAINTS.file.maxSize)).toBe("10 MB");
  });
});

describe("formatFileSize", () => {
  it("scales the unit to the value", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(formatFileSize(3 * 1024 * 1024 * 1024)).toBe("3 GB");
  });

  it("drops the decimal when the rounded value is whole", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });

  it("rounds to one decimal place", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(1740)).toBe("1.7 KB");
  });

  it("renders an em dash for null, undefined, or negative sizes", () => {
    expect(formatFileSize(null)).toBe("—");
    expect(formatFileSize(undefined)).toBe("—");
    expect(formatFileSize(-1)).toBe("—");
  });
});

describe("validateFile", () => {
  it("accepts an allowed extension within the size limit", () => {
    expect(validateFile({ name: "photo.png", size: 1024 }, "image")).toBeNull();
    expect(validateFile({ name: "notes.md", size: 512 }, "file")).toBeNull();
  });

  it("rejects an extension not allowed for the category", () => {
    // .png is an image ext, not a file ext.
    expect(validateFile({ name: "photo.png", size: 1024 }, "file")).toMatch(
      /Unsupported file type/,
    );
    // .exe is allowed nowhere.
    expect(validateFile({ name: "run.exe", size: 1024 }, "file")).toMatch(
      /Unsupported file type/,
    );
  });

  it("rejects a missing extension", () => {
    expect(validateFile({ name: "noext", size: 1024 }, "image")).toMatch(
      /Unsupported file type/,
    );
  });

  it("rejects an empty file", () => {
    expect(validateFile({ name: "empty.png", size: 0 }, "image")).toBe(
      "File is empty.",
    );
  });

  it("rejects a file over the category size limit", () => {
    const overImage = FILE_CONSTRAINTS.image.maxSize + 1;
    expect(validateFile({ name: "big.png", size: overImage }, "image")).toMatch(
      /too large.*5 MB/,
    );
  });

  it("accepts a file exactly at the size limit", () => {
    const atLimit = FILE_CONSTRAINTS.file.maxSize;
    expect(validateFile({ name: "big.pdf", size: atLimit }, "file")).toBeNull();
  });
});
