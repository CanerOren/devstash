"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { LanguageCombobox } from "@/components/items/LanguageCombobox";
import type { CollectionOption } from "@/lib/db/collections";

// Controlled edit-form state. Mostly raw strings; the server action normalizes
// empties to null and splits the comma-separated tags. `collectionIds` is the
// set of collections the item belongs to (an id list, not a string).
export interface ItemEditState {
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string; // comma-separated
  collectionIds: string[];
}

// Which optional fields a given item type exposes (per the spec's table).
const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
// Code types get the Monaco editor for their content; markdown types (note,
// prompt) get the Markdown editor; the rest keep a plain Textarea.
const CODE_TYPES = new Set(["snippet", "command"]);
const MARKDOWN_TYPES = new Set(["note", "prompt"]);

export function initialEditState(detail: {
  title: string;
  description: string | null;
  content: string | null;
  language: string | null;
  url: string | null;
  tags: string[];
  collections: { id: string; name: string }[];
}): ItemEditState {
  return {
    title: detail.title,
    description: detail.description ?? "",
    content: detail.content ?? "",
    language: detail.language ?? "",
    url: detail.url ?? "",
    tags: detail.tags.join(", "),
    collectionIds: detail.collections.map((collection) => collection.id),
  };
}

interface ItemEditFormProps {
  // Raw type name, e.g. "snippet" — drives which type-specific fields show.
  typeName: string;
  value: ItemEditState;
  onChange: (next: ItemEditState) => void;
  // The user's collections, for the collection multi-select.
  collections: CollectionOption[];
}

// Presentational, controlled edit form. Renders the always-on fields (title,
// description, tags) plus the type-specific ones (content / language / url).
// Save/Cancel live in the drawer header, so they're not rendered here; the
// drawer owns this state and the submit logic.
export function ItemEditForm({
  typeName,
  value,
  onChange,
  collections,
}: ItemEditFormProps) {
  const set = <K extends keyof ItemEditState>(key: K, v: ItemEditState[K]) =>
    onChange({ ...value, [key]: v });

  // Toggle a collection id in/out of the selected set.
  const toggleCollection = (id: string) =>
    set(
      "collectionIds",
      value.collectionIds.includes(id)
        ? value.collectionIds.filter((c) => c !== id)
        : [...value.collectionIds, id],
    );

  // Comma-joined names of the selected collections, for the dropdown trigger.
  const selectedLabel = collections
    .filter((collection) => value.collectionIds.includes(collection.id))
    .map((collection) => collection.name)
    .join(", ");

  const showContent = CONTENT_TYPES.has(typeName);
  const showLanguage = LANGUAGE_TYPES.has(typeName);
  const showUrl = typeName === "link";
  const useCodeEditor = CODE_TYPES.has(typeName);
  const useMarkdownEditor = MARKDOWN_TYPES.has(typeName);

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

      {showLanguage && (
        <Field id="item-language" label="Language">
          <LanguageCombobox
            id="item-language"
            value={value.language}
            onChange={(next) => set("language", next)}
          />
        </Field>
      )}

      {showContent && (
        <Field id="item-content" label="Content">
          {useCodeEditor ? (
            <CodeEditor
              value={value.content}
              language={value.language}
              onChange={(next) => set("content", next)}
            />
          ) : useMarkdownEditor ? (
            <MarkdownEditor
              value={value.content}
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

      <div className="space-y-2">
        <Label>Collections</Label>
        {collections.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No collections yet — create one from the top bar.
          </p>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
              >
                <span
                  className={
                    selectedLabel
                      ? "truncate"
                      : "truncate text-muted-foreground"
                  }
                >
                  {selectedLabel || "Select collections"}
                </span>
                <ChevronDown className="size-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-64 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
            >
              {collections.map((collection) => (
                <DropdownMenuCheckboxItem
                  key={collection.id}
                  checked={value.collectionIds.includes(collection.id)}
                  // Keep the menu open so several can be toggled in one pass.
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={() => toggleCollection(collection.id)}
                >
                  {collection.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
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
