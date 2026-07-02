"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/items/CodeEditor";

// Controlled edit-form state — all strings (raw input values). The server action
// normalizes empties to null and splits the comma-separated tags.
export interface ItemEditState {
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string; // comma-separated
}

// Which optional fields a given item type exposes (per the spec's table).
const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
// Code types get the Monaco editor for their content; the rest keep a Textarea.
const CODE_TYPES = new Set(["snippet", "command"]);

export function initialEditState(detail: {
  title: string;
  description: string | null;
  content: string | null;
  language: string | null;
  url: string | null;
  tags: string[];
}): ItemEditState {
  return {
    title: detail.title,
    description: detail.description ?? "",
    content: detail.content ?? "",
    language: detail.language ?? "",
    url: detail.url ?? "",
    tags: detail.tags.join(", "),
  };
}

interface ItemEditFormProps {
  // Raw type name, e.g. "snippet" — drives which type-specific fields show.
  typeName: string;
  value: ItemEditState;
  onChange: (next: ItemEditState) => void;
}

// Presentational, controlled edit form. Renders the always-on fields (title,
// description, tags) plus the type-specific ones (content / language / url).
// Save/Cancel live in the drawer header, so they're not rendered here; the
// drawer owns this state and the submit logic.
export function ItemEditForm({ typeName, value, onChange }: ItemEditFormProps) {
  const set = <K extends keyof ItemEditState>(key: K, v: ItemEditState[K]) =>
    onChange({ ...value, [key]: v });

  const showContent = CONTENT_TYPES.has(typeName);
  const showLanguage = LANGUAGE_TYPES.has(typeName);
  const showUrl = typeName === "link";
  const useCodeEditor = CODE_TYPES.has(typeName);

  return (
    <div className="space-y-5">
      <Field id="item-title" label="Title">
        <Input
          id="item-title"
          value={value.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Title"
          required
        />
      </Field>

      <Field id="item-description" label="Description">
        <Textarea
          id="item-description"
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Optional description"
          rows={2}
        />
      </Field>

      {showContent && (
        <Field id="item-content" label="Content">
          {useCodeEditor ? (
            <CodeEditor
              value={value.content}
              language={value.language}
              onChange={(next) => set("content", next)}
            />
          ) : (
            <Textarea
              id="item-content"
              value={value.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="Content"
              rows={8}
              className="font-mono text-xs leading-relaxed"
            />
          )}
        </Field>
      )}

      {showLanguage && (
        <Field id="item-language" label="Language">
          <Input
            id="item-language"
            value={value.language}
            onChange={(e) => set("language", e.target.value)}
            placeholder="e.g. typescript"
          />
        </Field>
      )}

      {showUrl && (
        <Field id="item-url" label="URL">
          <Input
            id="item-url"
            type="url"
            value={value.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://example.com"
          />
        </Field>
      )}

      <Field id="item-tags" label="Tags">
        <Input
          id="item-tags"
          value={value.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="Comma-separated, e.g. react, hooks"
        />
        <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
      </Field>
    </div>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
