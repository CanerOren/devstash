import { Code2, File, Link as LinkIcon, Search, Sparkles, SquareTerminal } from "lucide-react";
import type { IconType } from "./data";

// A static "…with DevStash" mini-dashboard mockup shown opposite the chaos
// field. Purely decorative — mirrors the real app's sidebar + item cards.
const PREVIEW_NAV: { label: string; color: string; Icon: IconType; active?: boolean }[] = [
  { label: "Snippets", color: "#3b82f6", Icon: Code2, active: true },
  { label: "Prompts", color: "#f59e0b", Icon: Sparkles },
  { label: "Commands", color: "#06b6d4", Icon: SquareTerminal },
  { label: "Notes", color: "#22c55e", Icon: File },
  { label: "Links", color: "#6366f1", Icon: LinkIcon },
];

const PREVIEW_CARDS: { title: string; color: string; Icon: IconType; tags: string[] }[] = [
  { title: "useDebounce", color: "#3b82f6", Icon: Code2, tags: ["react", "typescript"] },
  { title: "Code review", color: "#f59e0b", Icon: Sparkles, tags: ["ai", "prompt"] },
  { title: "git rebase -i", color: "#06b6d4", Icon: SquareTerminal, tags: ["git"] },
  { title: "Deploy checklist", color: "#22c55e", Icon: File, tags: ["ops", "release"] },
];

export function DashboardPreview() {
  return (
    <div className="min-w-0">
      <span className="mb-3 block text-center text-[0.82rem] font-semibold text-mk-dim">
        …with DevStash
      </span>
      <div className="grid h-80 grid-cols-[132px_1fr] overflow-hidden rounded-[14px] border border-mk-border bg-mk-elevated">
        {/* Sidebar rail */}
        <aside className="flex min-w-0 flex-col gap-3.5 border-r border-mk-border bg-mk-surface px-2.5 py-3.5">
          <div className="flex items-center gap-2 px-1">
            <span className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-[linear-gradient(135deg,#3b82f6,#6366f1)] text-[0.62rem] font-extrabold text-white">
              DS
            </span>
            <span className="text-[0.78rem] font-bold tracking-[-0.01em]">DevStash</span>
          </div>
          <div className="flex flex-col gap-[3px]">
            {PREVIEW_NAV.map(({ label, color, Icon, active }) => (
              <div
                key={label}
                style={{ "--c": color } as React.CSSProperties}
                className={
                  active
                    ? "flex items-center gap-[9px] rounded-lg bg-[color-mix(in_srgb,var(--c)_16%,transparent)] px-2 py-[7px] text-mk-text"
                    : "flex items-center gap-[9px] rounded-lg px-2 py-[7px] text-mk-muted"
                }
              >
                <Icon className="size-[15px] shrink-0 text-[var(--c)]" />
                <span className="truncate text-[0.72rem] font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-col gap-3 p-3">
          <div className="flex items-center gap-2">
            <span className="flex min-w-0 flex-1 items-center gap-[7px] rounded-lg border border-mk-border bg-mk-surface px-2.5 py-1.5 text-[0.72rem] text-mk-dim">
              <Search className="size-[13px] shrink-0" />
              <span className="mr-auto">Search…</span>
              <kbd className="rounded-[5px] border border-mk-border bg-mk-surface-2 px-[5px] py-px text-[0.62rem] text-mk-muted">
                ⌘K
              </kbd>
            </span>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#ec4899,#6366f1)] text-[0.6rem] font-bold text-white">
              DS
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[0.82rem] font-bold tracking-[-0.01em]">Recent</span>
            <span className="text-[0.64rem] text-mk-dim">24 items</span>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-2.5">
            {PREVIEW_CARDS.map(({ title, color, Icon, tags }) => (
              <div
                key={title}
                style={{ "--c": color } as React.CSSProperties}
                className="flex min-w-0 flex-col gap-2.5 rounded-[10px] border border-mk-border border-t-[3px] bg-mk-surface p-[11px] [border-top-color:var(--c)]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-[7px] border border-[color-mix(in_srgb,var(--c)_32%,transparent)] bg-[color-mix(in_srgb,var(--c)_15%,transparent)] text-[var(--c)]">
                    <Icon className="size-[13px]" />
                  </span>
                  <span className="truncate text-[0.74rem] font-semibold">{title}</span>
                </div>
                <div className="flex flex-wrap gap-[5px]">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[color-mix(in_srgb,var(--c)_28%,transparent)] bg-[color-mix(in_srgb,var(--c)_12%,transparent)] px-[7px] py-0.5 text-[0.58rem] font-semibold text-[var(--c)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="mt-3.5 block text-center text-[0.8rem] font-medium text-mk-dim">
        7 types. One fast search.
      </span>
    </div>
  );
}
