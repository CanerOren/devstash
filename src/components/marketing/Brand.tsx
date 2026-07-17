import Link from "next/link";
import { cn } from "@/lib/utils";

// DevStash wordmark + gradient "DS" logo box, reused by the nav and footer.
// `wordmarkClassName` lets a caller hide the wordmark on narrow screens (the
// aria-label carries the link either way); the nav needs it, the footer doesn't.
export function Brand({
  className,
  wordmarkClassName,
}: {
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="DevStash home"
      className={cn("inline-flex items-center gap-2.5 font-bold", className)}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-[0.85rem] font-extrabold tracking-[0.02em] text-white">
        DS
      </span>
      <span className={cn("text-[1.05rem] tracking-[-0.01em]", wordmarkClassName)}>
        DevStash
      </span>
    </Link>
  );
}
