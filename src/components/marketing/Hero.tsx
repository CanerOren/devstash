import { ArrowRight } from "lucide-react";
import { ChaosField } from "./ChaosField";
import { DashboardPreview } from "./DashboardPreview";
import { MarketingButton } from "./MarketingButton";
import { Reveal } from "./Reveal";

export function Hero() {
  return (
    <section className="relative z-[1] mx-auto max-w-[1180px] px-6 pb-16 pt-[calc(64px+72px)] text-center">
      <Reveal className="mx-auto max-w-[760px]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-mk-border bg-mk-surface px-3.5 py-1.5 text-[0.82rem] font-semibold text-mk-muted">
          ✦ Your dev knowledge, unified
        </span>
        <h1 className="mt-[22px] text-[clamp(2.4rem,6vw,4.2rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
          Stop Losing Your{" "}
          <span className="mk-gradient-text block">Developer Knowledge</span>
        </h1>
        <p className="mx-auto mt-[22px] max-w-[580px] text-[1.12rem] text-mk-muted">
          Snippets in VS Code. Prompts in chat history. Commands in a random{" "}
          <code className="rounded-md border border-mk-border bg-mk-surface px-1.5 py-px font-mono text-mk-text">
            .txt
          </code>
          . DevStash pulls it all into one fast, searchable, AI-enhanced hub.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <MarketingButton href="/register" size="lg">
            Get Started Free
          </MarketingButton>
          <MarketingButton href="#features" variant="ghost" size="lg">
            See Features
          </MarketingButton>
        </div>
      </Reveal>

      {/* Chaos → arrow → order showcase */}
      <Reveal className="mt-[72px] grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        <ChaosField />
        <div className="grid place-items-center px-1">
          <div className="mk-arrow grid size-14 place-items-center rounded-full bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-white max-md:rotate-90">
            <ArrowRight className="size-7" />
          </div>
        </div>
        <DashboardPreview />
      </Reveal>
    </section>
  );
}
