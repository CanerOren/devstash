"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { MarketingButton } from "./MarketingButton";
import { NAV_LINKS } from "./data";

// Fixed top nav, shared by the marketing homepage and the auth pages. Grows
// opaque + blurred once the page is scrolled. Nav links hide on mobile, which
// leaves room for both CTAs at every width. Whichever CTA points at the current
// page is dropped, so /sign-in never offers a "Sign In" button.
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100] h-16 border-b transition-all duration-300",
        scrolled
          ? "border-mk-border bg-mk-bg/80 backdrop-blur-md"
          : "border-transparent bg-mk-bg/20",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1180px] items-center gap-6 px-6">
        {/* Wordmark + both CTAs need ~403px of row incl. the px-6 gutters. Below
            that the wordmark gives way rather than the buttons clipping or
            crowding the edge — the DS mark still carries the link. */}
        <Brand wordmarkClassName="max-[420px]:hidden" />
        <nav aria-label="Primary" className="ml-4 hidden gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-mk-muted transition-colors hover:text-mk-text"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          {pathname !== "/sign-in" && (
            <MarketingButton href="/sign-in" variant="ghost">
              Sign In
            </MarketingButton>
          )}
          {pathname !== "/register" && (
            <MarketingButton href="/register">Get Started</MarketingButton>
          )}
        </div>
      </div>
    </header>
  );
}
