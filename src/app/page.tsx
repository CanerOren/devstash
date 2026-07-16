import type { Metadata } from "next";
import { AiSection } from "@/components/marketing/AiSection";
import { Cta } from "@/components/marketing/Cta";
import { Features } from "@/components/marketing/Features";
import { Hero } from "@/components/marketing/Hero";
import { Pricing } from "@/components/marketing/Pricing";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteNav } from "@/components/marketing/SiteNav";

export const metadata: Metadata = {
  title: "DevStash — One home for all your developer knowledge",
  description:
    "DevStash is a fast, searchable, AI-enhanced hub for your snippets, prompts, commands, notes, files, and links.",
};

export default function Home() {
  return (
    <div className="mk-page relative min-h-screen overflow-x-hidden bg-mk-bg text-mk-text">
      <SiteNav />
      <main className="relative z-[1]">
        <Hero />
        <Features />
        <AiSection />
        <Pricing />
        <Cta />
      </main>
      <SiteFooter />
    </div>
  );
}
