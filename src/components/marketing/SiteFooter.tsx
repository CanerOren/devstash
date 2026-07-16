import { Brand } from "./Brand";
import { FOOTER_COLUMNS } from "./data";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-[1] border-t border-mk-border bg-mk-elevated">
      <div className="mx-auto grid max-w-[1180px] gap-12 px-6 pb-10 pt-14 md:grid-cols-[1.4fr_2fr]">
        <div>
          <Brand />
          <p className="mt-3.5 max-w-[280px] text-[0.92rem] text-mk-muted">
            One fast, searchable, AI-enhanced hub for all your dev knowledge.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-2.5">
              <h4 className="mb-1 text-[0.8rem] font-bold uppercase tracking-[0.06em] text-mk-dim">
                {col.title}
              </h4>
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[0.92rem] text-mk-muted transition-colors hover:text-mk-text"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-3 border-t border-mk-border px-6 py-5 text-[0.85rem] text-mk-dim max-[560px]:justify-center max-[560px]:text-center">
        <span>© {year} DevStash. All rights reserved.</span>
        <span>Built for developers, by developers.</span>
      </div>
    </footer>
  );
}
