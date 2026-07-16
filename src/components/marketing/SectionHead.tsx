import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

// Centered eyebrow + title used by the Features and Pricing sections. `children`
// renders below the title (a lead paragraph, or the pricing billing toggle).
export function SectionHead({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={cn("mx-auto mb-14 max-w-[640px] text-center", className)}>
      <span className="mb-3.5 inline-block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-snippet">
        {eyebrow}
      </span>
      <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-[750] leading-[1.15] tracking-[-0.02em]">
        {title}
      </h2>
      {children}
    </Reveal>
  );
}
