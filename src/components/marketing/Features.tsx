import { FEATURES } from "./data";
import { Reveal } from "./Reveal";
import { SectionHead } from "./SectionHead";

export function Features() {
  return (
    <section id="features" className="mk-band relative z-[1] scroll-mt-20">
      <div className="mx-auto max-w-[1180px] px-6 py-24">
        <SectionHead
          eyebrow="Everything in one place"
          title="Built for how developers actually work"
        >
          <p className="mt-4 text-[1.05rem] text-mk-muted">
            Seven item types, unlimited collections, and full-text search — all a
            keystroke away.
          </p>
        </SectionHead>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, description, color, Icon }) => (
            <Reveal key={title}>
              <article
                style={{ "--c": color } as React.CSSProperties}
                className="group relative h-full overflow-hidden rounded-[14px] border border-mk-border bg-mk-surface p-[26px] transition-all duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--c)_45%,var(--color-mk-border))] hover:shadow-[0_18px_40px_-20px_color-mix(in_srgb,var(--c)_60%,transparent)]"
              >
                <span className="absolute inset-x-0 top-0 h-[3px] bg-[var(--c)] opacity-90" />
                <div className="mb-[18px] grid size-[46px] place-items-center rounded-xl border border-[color-mix(in_srgb,var(--c)_30%,transparent)] bg-[color-mix(in_srgb,var(--c)_14%,transparent)] text-[var(--c)]">
                  <Icon className="size-6" />
                </div>
                <h3 className="text-[1.15rem] font-bold tracking-[-0.01em]">
                  {title}
                </h3>
                <p className="mt-2 text-[0.95rem] text-mk-muted">{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
