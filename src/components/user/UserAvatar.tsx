import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Initials derived from a display name, e.g. "Brad Traversy" → "BT".
// Falls back gracefully for single-word names and email addresses.
export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

// Reusable user avatar: shows the user's image (e.g. their GitHub photo) when
// present, otherwise falls back to initials generated from the display name.
export function UserAvatar({
  name,
  image,
  size = "default",
  className,
}: {
  name: string;
  image?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      {image ? <AvatarImage src={image} alt={name} /> : null}
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}
