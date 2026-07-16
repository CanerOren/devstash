"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Scroll-in fade-up wrapper. Adds `.mk-in` once the element scrolls into view;
// the fade + any child stagger animations (see .mk-tag) key off that class in
// globals.css. Reduced-motion users see content immediately (also handled in
// CSS). Wrap section headings / card groups with this.
export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      // Rare no-IO fallback: reveal on the next frame (setting state directly
      // in the effect body would trigger cascading renders).
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("mk-reveal", inView && "mk-in", className)}>
      {children}
    </div>
  );
}
