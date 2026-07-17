// Co-located data that drives the repeated marketing UI (nav links, chaos
// icons, feature cards, pricing tiers, footer columns). Keeping these as `const`
// arrays lets each section map over them instead of hand-writing markup.
import {
  AppWindow,
  Bookmark,
  Code2,
  File,
  FileText,
  Folder,
  Search,
  Sparkles,
  SquareTerminal,
} from "lucide-react";
import { GitHubIcon } from "@/components/auth/GitHubIcon";
import { NotionIcon, SlackIcon } from "./brand-icons";

export type IconType = React.ComponentType<{ className?: string }>;

export interface NavLink {
  label: string;
  href: string;
}

// Root-relative so they still resolve from the auth pages, which render the
// same nav but have no #features / #pricing sections of their own. On the
// homepage these still scroll to the section rather than reloading.
export const NAV_LINKS: NavLink[] = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
];

// Hero "chaos field" — the scattered sources DevStash unifies. `color` tints
// the tile via a CSS custom property; the animation is in ChaosField.
export interface ChaosIcon {
  label: string;
  color: string;
  Icon: IconType;
}

export const CHAOS_ICONS: ChaosIcon[] = [
  { label: "Notion", color: "#ffffff", Icon: NotionIcon },
  { label: "GitHub", color: "#ffffff", Icon: GitHubIcon },
  { label: "Slack", color: "#e01e5a", Icon: SlackIcon },
  { label: "VS Code", color: "#23a9f2", Icon: Code2 },
  { label: "Browser tabs", color: "#f59e0b", Icon: AppWindow },
  { label: "Terminal", color: "#22c55e", Icon: SquareTerminal },
  { label: "Text file", color: "#94a3b8", Icon: FileText },
  { label: "Bookmark", color: "#ec4899", Icon: Bookmark },
];

export interface Feature {
  title: string;
  description: string;
  color: string;
  Icon: IconType;
}

export const FEATURES: Feature[] = [
  {
    title: "Code Snippets",
    description:
      "Save reusable code with syntax highlighting for every language and copy it in one click.",
    color: "#3b82f6",
    Icon: Code2,
  },
  {
    title: "AI Prompts",
    description:
      "Keep your best prompts, system messages, and workflows organized and ready to reuse.",
    color: "#f59e0b",
    Icon: Sparkles,
  },
  {
    title: "Instant Search",
    description:
      "Full-text search across titles, content, tags, and types with a Cmd+K command palette.",
    color: "#6366f1",
    Icon: Search,
  },
  {
    title: "Commands",
    description:
      "Never dig through bash history again. Store every CLI command with a description.",
    color: "#06b6d4",
    Icon: SquareTerminal,
  },
  {
    title: "Files & Docs",
    description:
      "Upload context files, PDFs, and images to secure cloud storage — attached to your stash.",
    color: "#64748b",
    Icon: File,
  },
  {
    title: "Collections",
    description:
      "Group anything into named collections. Items can live in as many as you like.",
    color: "#22c55e",
    Icon: Folder,
  },
];

// AI section — Pro capability checklist + the mocked "AI Generated Tags".
export const AI_CAPABILITIES: string[] = [
  "Auto-tagging from content",
  "One-line summaries for notes & snippets",
  '"Explain this code" in plain English',
  "Prompt optimizer for clarity & performance",
];

export const AI_TAGS: { label: string; color: string }[] = [
  { label: "react-hook", color: "#3b82f6" },
  { label: "typescript", color: "#f59e0b" },
  { label: "performance", color: "#06b6d4" },
  { label: "debounce", color: "#22c55e" },
];

// Pricing. A `null` price note means "no note". `included: false` renders the
// muted "–" marker instead of the green check.
export interface PriceFeature {
  label: string;
  included: boolean;
}

export interface PricingTier {
  name: string;
  amount: string; // monthly amount shown by default
  amountYearly: string;
  per: string;
  perYearly: string;
  note: string;
  noteYearly: string;
  features: PriceFeature[];
  cta: string;
  ctaVariant: "primary" | "ghost";
  popular: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Free",
    amount: "$0",
    amountYearly: "$0",
    per: "/forever",
    perYearly: "/forever",
    note: "Everything you need to get started.",
    noteYearly: "Everything you need to get started.",
    features: [
      { label: "50 items total", included: true },
      { label: "3 collections", included: true },
      { label: "Snippets, prompts, commands, notes, links", included: true },
      { label: "Full-text search", included: true },
      { label: "File & image uploads", included: false },
      { label: "AI features", included: false },
    ],
    cta: "Get Started",
    ctaVariant: "ghost",
    popular: false,
  },
  {
    name: "Pro",
    amount: "$8",
    amountYearly: "$6",
    per: "/mo",
    perYearly: "/mo billed yearly",
    note: "Billed monthly.",
    noteYearly: "$72 billed once a year.",
    features: [
      { label: "Unlimited items", included: true },
      { label: "Unlimited collections", included: true },
      { label: "File & image uploads", included: true },
      { label: "AI auto-tagging & summaries", included: true },
      { label: "AI code explanation & prompt optimizer", included: true },
      { label: "Export (JSON / ZIP) & priority support", included: true },
    ],
    cta: "Go Pro",
    ctaVariant: "primary",
    popular: true,
  },
];

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];
