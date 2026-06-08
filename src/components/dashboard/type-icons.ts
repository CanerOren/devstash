import {
  Code,
  File,
  Image,
  Link as LinkIcon,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

// Maps the `icon` name stored on an ItemType (see src/lib/mock-data.ts) to its
// Lucide component. Falls back to File for any unknown name.
const TYPE_ICONS: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: LinkIcon,
};

export function getTypeIcon(name: string): LucideIcon {
  return TYPE_ICONS[name] ?? File;
}
