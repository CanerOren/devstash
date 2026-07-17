"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { MarketingButton } from "./MarketingButton";
import { NAV_LINKS } from "./data";

// Fixed top nav, shared by the marketing homepage and the auth pages. Grows
// opaque + blurred once the page is scrolled (or while the mobile menu is open).
// On desktop the nav links sit inline and both CTAs show on the right. Below
// `md` the links collapse into a hamburger dropdown that also carries "Sign In",
// leaving only the primary CTA + the toggle in the bar so it never overflows at
// 375px. Whichever CTA points at the current page is dropped, so /sign-in never
// offers a "Sign In" button.
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showSignIn = pathname !== "/sign-in";
  const showGetStarted = pathname !== "/register";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100] border-b transition-all duration-300",
        scrolled || menuOpen
          ? "border-mk-border bg-mk-bg/80 backdrop-blur-md"
          : "border-transparent bg-mk-bg/20",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-6 px-6">
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
          {showSignIn && (
            <MarketingButton
              href="/sign-in"
              variant="ghost"
              className="hidden md:inline-flex"
            >
              Sign In
            </MarketingButton>
          )}
          {showGetStarted && (
            <MarketingButton href="/register">Get Started</MarketingButton>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="inline-flex size-9 items-center justify-center rounded-lg text-mk-text transition-colors hover:bg-mk-surface md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile"
          className="border-t border-mk-border bg-mk-bg/95 backdrop-blur-md md:hidden"
        >
          <div className="mx-auto flex max-w-[1180px] flex-col gap-1 px-6 py-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md py-2.5 text-sm font-medium text-mk-muted transition-colors hover:text-mk-text"
              >
                {link.label}
              </a>
            ))}
            {showSignIn && (
              <MarketingButton
                href="/sign-in"
                variant="ghost"
                block
                className="mt-2"
              >
                Sign In
              </MarketingButton>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
