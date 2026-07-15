"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from "@/lib/editor-preferences";

// How long to wait after the last change before persisting. Coalesces a burst
// of changes (e.g. toggling several controls) into a single write + toast.
const SAVE_DEBOUNCE_MS = 600;

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  // Merge a partial change into the current preferences and auto-save
  // (debounced). Optimistic — the UI reflects the change immediately.
  update: (partial: Partial<EditorPreferences>) => void;
}

// Default context so a consumer rendered outside the provider (e.g. a stray
// CodeEditor) still reads sane preferences and never crashes.
const EditorPreferencesContext = createContext<EditorPreferencesContextValue>({
  preferences: DEFAULT_EDITOR_PREFERENCES,
  update: () => {},
});

// Read the current editor preferences (and an updater). Falls back to defaults
// outside a provider.
export function useEditorPreferences(): EditorPreferencesContextValue {
  return useContext(EditorPreferencesContext);
}

// Holds the current editor preferences and auto-saves changes to the DB
// (debounced) with a success toast. Mounted high in the app shell so both the
// settings section (which edits) and the CodeEditor (which reads) share state.
export function EditorPreferencesProvider({
  initial,
  children,
}: {
  initial: EditorPreferences;
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<EditorPreferences>(initial);

  // The value to persist on the next debounce tick, and the pending timer.
  const latest = useRef<EditorPreferences>(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending save when the provider unmounts.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const update = useCallback((partial: Partial<EditorPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...partial };
      latest.current = next;
      return next;
    });

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const result = await updateEditorPreferences(latest.current);
      if (result.success) {
        toast.success("Editor preferences saved");
      } else {
        toast.error(result.error ?? "Couldn't save editor preferences");
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  return (
    <EditorPreferencesContext.Provider value={{ preferences, update }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}
