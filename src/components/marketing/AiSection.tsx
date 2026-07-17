import { AI_CAPABILITIES, AI_TAGS } from "./data";
import { Reveal } from "./Reveal";

// Syntax-highlighted mock of a useDebounce hook. Modelled as token lines so the
// JSX stays readable and whitespace inside <pre> is preserved reliably.
type Tok = { t: string; c?: "key" | "fn" | "num" };
const TOKEN_CLASS: Record<NonNullable<Tok["c"]>, string> = {
  key: "text-[#ff7b72]",
  fn: "text-[#d2a8ff]",
  num: "text-[#79c0ff]",
};

const CODE_LINES: Tok[][] = [
  [{ t: "export function", c: "key" }, { t: " " }, { t: "useDebounce", c: "fn" }, { t: "<T>(" }],
  [{ t: "  value: T," }],
  [{ t: "  delay = " }, { t: "300", c: "num" }],
  [{ t: ") {" }],
  [{ t: "  " }, { t: "const", c: "key" }, { t: " [debounced, setDebounced] = " }, { t: "useState", c: "fn" }, { t: "(value);" }],
  [{ t: "  " }, { t: "useEffect", c: "fn" }, { t: "(() => {" }],
  [{ t: "    " }, { t: "const", c: "key" }, { t: " id = " }, { t: "setTimeout", c: "fn" }, { t: "(() => " }, { t: "setDebounced", c: "fn" }, { t: "(value), delay);" }],
  [{ t: "    " }, { t: "return", c: "key" }, { t: " () => " }, { t: "clearTimeout", c: "fn" }, { t: "(id);" }],
  [{ t: "  }, [value, delay]);" }],
  [{ t: "  " }, { t: "return", c: "key" }, { t: " debounced;" }],
  [{ t: "}" }],
];

export function AiSection() {
  return (
    <section className="relative z-[1] mx-auto max-w-[1180px] px-6 py-24">
      <div className="grid items-center gap-14 md:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] px-3.5 py-1.5 text-[0.82rem] font-semibold text-prompt">
            ◆ Pro Feature
          </span>
          <h2 className="mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] font-[750] leading-[1.15] tracking-[-0.02em]">
            Let AI do the busywork
          </h2>
          <p className="mt-4 text-[1.05rem] text-mk-muted">
            DevStash Pro reads your content and enhances it — so you can focus on
            building, not organizing.
          </p>
          <ul className="mt-7 grid list-none gap-3.5">
            {AI_CAPABILITIES.map((capability) => (
              <li
                key={capability}
                className="flex items-center gap-3 text-[1.02rem] text-mk-text"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-[7px] border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.12)] text-[0.8rem] font-extrabold text-note">
                  ✓
                </span>
                {capability}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* min-w-0: grid items default to min-width:auto, which would let the
            long code lines widen the column past the viewport instead of
            letting the <pre> scroll. */}
        <Reveal className="min-w-0">
          <div className="overflow-hidden rounded-[14px] border border-mk-border bg-[#0d0d10] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2 border-b border-mk-border bg-mk-surface px-4 py-3">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 font-mono text-[0.8rem] text-mk-dim">
                useDebounce.ts
              </span>
            </div>
            <pre className="m-0 overflow-x-auto p-5 font-mono text-[0.82rem] leading-[1.7] text-[#c9d1d9]">
              <code>
                {CODE_LINES.map((line, i) => (
                  <span key={i}>
                    {line.map((tok, j) =>
                      tok.c ? (
                        <span key={j} className={TOKEN_CLASS[tok.c]}>
                          {tok.t}
                        </span>
                      ) : (
                        tok.t
                      ),
                    )}
                    {i < CODE_LINES.length - 1 ? "\n" : ""}
                  </span>
                ))}
              </code>
            </pre>
            <div className="border-t border-mk-border bg-mk-surface px-5 pb-5 pt-4">
              <span className="mb-3 block text-[0.78rem] font-semibold text-prompt">
                ✦ AI Generated Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {AI_TAGS.map(({ label, color }) => (
                  <span
                    key={label}
                    style={{ "--c": color } as React.CSSProperties}
                    className="mk-tag rounded-full border border-[color-mix(in_srgb,var(--c)_35%,transparent)] bg-[color-mix(in_srgb,var(--c)_14%,transparent)] px-3 py-1 text-[0.78rem] font-semibold text-[var(--c)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
