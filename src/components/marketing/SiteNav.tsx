"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { MarketingButton } from "./MarketingButton";
import { NAV_LINKS } from "./data";

// Fixed top nav. Grows opaque + blurred once the page is scrolled. Nav links
// hide on mobile; the ghost "Sign In" hides on the smallest screens.
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

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
        <Brand />
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
          <MarketingButton
            href="/sign-in"
            variant="ghost"
            className="max-[560px]:hidden"
          >
            Sign In
          </MarketingButton>
          <MarketingButton href="/register">Get Started</MarketingButton>
        </div>
      </div>
    </header>
  );
}
