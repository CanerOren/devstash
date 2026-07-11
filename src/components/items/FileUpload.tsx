"use client";

import { useEffect, useRef, useState } from "react";
import { File as FileIcon, Loader2, UploadCloud, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  acceptAttribute,
  formatFileSize,
  formatMaxSize,
  FILE_CONSTRAINTS,
  validateFile,
  type FileCategory,
} from "@/lib/file-constraints";

// The uploaded object's metadata, persisted onto the item by createItem.
export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

interface FileUploadProps {
  category: FileCategory;
  value: UploadedFile | null;
  onChange: (value: UploadedFile | null) => void;
}

// Drag-and-drop file upload for the file/image item types. Uploads to /api/upload
// immediately on selection (with an XHR progress bar), then reports the returned
// R2 metadata up via onChange. Shows an image preview for images and a file-info
// card for files, with a button to remove/replace.
export function FileUpload({ category, value, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Local object URL for the image preview — avoids fetching the (flaky) public
  // R2 URL for a file we already have in hand. Revoked when it changes/unmounts.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const constraint = FILE_CONSTRAINTS[category];

  function upload(file: File) {
    const validationError = validateFile(
      { name: file.name, size: file.size },
      category,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);
    if (category === "image") {
      setPreviewUrl(URL.createObjectURL(file));
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    // XHR (not fetch) so we can show upload progress.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      let body: { success?: boolean; data?: UploadedFile; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // fall through to the generic error below
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.success && body.data) {
        onChange(body.data);
      } else {
        setError(body.error ?? "Upload failed. Please try again.");
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Upload failed. Please try again.");
    };

    xhr.send(formData);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (uploading) return;
    const file = event.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) upload(file);
    // Reset so selecting the same file again re-triggers change.
    event.target.value = "";
  }

  function clear() {
    onChange(null);
    setError(null);
    setProgress(0);
    setPreviewUrl(null);
  }

  // Uploaded — show a preview (image) or file-info card, with a remove button.
  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-lg border border-border p-3">
          {category === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl ?? value.fileUrl}
              alt={value.fileName}
              className="size-16 shrink-0 rounded-md border border-border object-cover"
            />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
              <FileIcon className="size-6 text-muted-foreground" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(value.fileSize)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clear}
            aria-label="Remove file"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center transition-colors hover:bg-accent/50 disabled:cursor-default disabled:hover:bg-transparent",
          dragging && "border-primary bg-accent/50",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading… {progress}%</p>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="size-6 text-muted-foreground" />
            <p className="text-sm">
              <span className="font-medium text-foreground">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              {constraint.extensions.join(", ")} · up to{" "}
              {formatMaxSize(constraint.maxSize)}
            </p>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttribute(category)}
        onChange={handleSelect}
        className="hidden"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
