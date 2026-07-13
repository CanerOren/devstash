import { Download, ExternalLink, FileText } from "lucide-react";

import { formatFileSize } from "@/lib/file-constraints";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import type { ItemDetailResponse } from "@/components/items/item-detail-response";

// Code types get the Monaco editor for their content; markdown types (note,
// prompt) get the rendered Markdown preview; the rest keep a plain block.
const CODE_TYPES = new Set(["snippet", "command"]);
const MARKDOWN_TYPES = new Set(["note", "prompt"]);

// Renders the item's content per its content type: the Monaco code editor for
// snippet/command TEXT items, the Markdown preview for note/prompt items, a
// plain block for other text, the link for URL items, and file info for FILE.
export function ItemContentBlock({
  detail,
}: {
  detail: ItemDetailResponse | null;
}) {
  if (!detail) return null;

  if (detail.contentType === "URL" && detail.url) {
    return (
      <a
        href={detail.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ExternalLink className="size-3.5" />
        {detail.url}
      </a>
    );
  }

  if (detail.contentType === "FILE") {
    const isImage = detail.type.name === "image";
    return (
      <div className="space-y-3">
        {isImage && detail.fileUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            // Served through our origin (streams from R2's S3 endpoint) rather
            // than the flaky public r2.dev URL.
            src={`/api/items/${detail.id}/image`}
            alt={detail.fileName ?? detail.title}
            className="max-h-96 w-auto max-w-full rounded-lg border border-border object-contain"
          />
        )}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/50">
              <FileText className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {detail.fileName ?? "Attached file"}
              </p>
              {detail.fileSize != null && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(detail.fileSize)}
                </p>
              )}
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <a href={`/api/items/${detail.id}/download`} download>
              <Download className="size-4" />
              Download
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (detail.content) {
    if (CODE_TYPES.has(detail.type.name)) {
      return (
        <CodeEditor value={detail.content} language={detail.language} readOnly />
      );
    }
    if (MARKDOWN_TYPES.has(detail.type.name)) {
      return <MarkdownEditor value={detail.content} readOnly />;
    }
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs leading-relaxed">
        <code>{detail.content}</code>
      </pre>
    );
  }

  return <p className="text-sm text-muted-foreground">No content.</p>;
}
