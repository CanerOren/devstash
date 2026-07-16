import { MarketingButton } from "./MarketingButton";
import { Reveal } from "./Reveal";

export function Cta() {
  return (
    <section className="relative z-[1] mx-auto max-w-[1180px] px-6 pb-24">
      <Reveal>
        <div className="rounded-3xl border border-mk-border bg-mk-surface bg-[radial-gradient(80%_120%_at_50%_0%,rgba(99,102,241,0.18),transparent_65%)] px-8 py-16 text-center">
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-[780] tracking-[-0.02em]">
            Ready to Organize Your Knowledge?
          </h2>
          <p className="mx-auto mb-7 mt-3.5 max-w-[480px] text-[1.05rem] text-mk-muted">
            Join the developers who never lose a snippet, prompt, or command
            again.
          </p>
          <MarketingButton href="/register" size="lg">
            Get Started Free
          </MarketingButton>
        </div>
      </Reveal>
    </section>
  );
}
