import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A landing-page button built on the shadcn Button (focus ring + asChild) but
// restyled to the prototype's gradient-primary / bordered-ghost look. We use
// the `ghost` base variant (no base background) and layer our own colors so the
// primary gradient (a background *image*) always sits above, and the ghost
// hover states — including the shadcn `dark:hover:` override — are replaced.
type MarketingButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  block?: boolean;
  className?: string;
};

const VARIANTS: Record<"primary" | "ghost", string> = {
  primary:
    "bg-[linear-gradient(135deg,#60a5fa,#3b82f6_55%,#2563eb)] text-white hover:text-white shadow-[0_6px_20px_-6px_rgba(59,130,246,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(59,130,246,0.75)]",
  ghost:
    "border-mk-border bg-mk-surface text-mk-text hover:border-mk-border-strong hover:bg-mk-surface-2 dark:hover:bg-mk-surface-2 hover:text-mk-text",
};

const SIZES: Record<"md" | "lg", string> = {
  md: "h-auto px-[18px] py-[9px] text-sm",
  lg: "h-auto px-[26px] py-[13px] text-base",
};

export function MarketingButton({
  href,
  children,
  variant = "primary",
  size = "md",
  block = false,
  className,
}: MarketingButtonProps) {
  const internal = href.startsWith("/");
  const classes = cn(
    "rounded-[10px] border font-semibold hover:-translate-y-px",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    className,
  );

  return (
    <Button asChild variant="ghost" className={classes}>
      {internal ? (
        <Link href={href}>{children}</Link>
      ) : (
        <a href={href}>{children}</a>
      )}
    </Button>
  );
}
