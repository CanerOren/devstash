"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorPreferences } from "@/components/editor/editor-preferences-context";
import {
  EDITOR_THEMES,
  FONT_SIZE_OPTIONS,
  TAB_SIZE_OPTIONS,
} from "@/lib/editor-preferences";

// The Editor Preferences settings section. Reads/writes the shared editor
// preferences context, which auto-saves each change (debounced) and toasts on
// success — so there's no save button here.
export function EditorPreferencesSection() {
  const { preferences, update } = useEditorPreferences();

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Editor Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Customize the code editor. Changes are saved automatically.
        </p>
      </div>

      <div className="space-y-4">
        <Row
          htmlFor="editor-font-size"
          label="Font size"
          description="Text size in the code editor."
        >
          <Select
            value={String(preferences.fontSize)}
            onValueChange={(v) => update({ fontSize: Number(v) })}
          >
            <SelectTrigger id="editor-font-size" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        <Row
          htmlFor="editor-tab-size"
          label="Tab size"
          description="Number of spaces per indentation level."
          bordered
        >
          <Select
            value={String(preferences.tabSize)}
            onValueChange={(v) => update({ tabSize: Number(v) })}
          >
            <SelectTrigger id="editor-tab-size" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAB_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        <Row
          htmlFor="editor-word-wrap"
          label="Word wrap"
          description="Wrap long lines instead of scrolling horizontally."
          bordered
        >
          <Switch
            id="editor-word-wrap"
            checked={preferences.wordWrap}
            onCheckedChange={(checked) => update({ wordWrap: checked })}
          />
        </Row>

        <Row
          htmlFor="editor-minimap"
          label="Minimap"
          description="Show the code overview on the right edge."
          bordered
        >
          <Switch
            id="editor-minimap"
            checked={preferences.minimap}
            onCheckedChange={(checked) => update({ minimap: checked })}
          />
        </Row>

        <Row
          htmlFor="editor-theme"
          label="Theme"
          description="Color theme for syntax highlighting."
          bordered
        >
          <Select
            value={preferences.theme}
            onValueChange={(v) =>
              update({ theme: v as (typeof EDITOR_THEMES)[number]["value"] })
            }
          >
            <SelectTrigger id="editor-theme" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITOR_THEMES.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      </div>
    </section>
  );
}

function Row({
  htmlFor,
  label,
  description,
  children,
  bordered,
}: {
  htmlFor: string;
  label: string;
  description: string;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-wrap items-center justify-between gap-3" +
        (bordered ? " border-t border-border pt-4" : "")
      }
    >
      <div>
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
