// Brand marks lucide-react doesn't ship, as tiny local SVG components — same
// pattern as the auth GitHubIcon. Used by the hero "chaos field". They inherit
// `currentColor` so the parent's text color drives them.

export function NotionIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M4 4.6 14.3 3.8c1.3-.1 1.6 0 2.4.6l2.6 1.8c.5.4.7.5.7 1v12.4c0 .8-.3 1.3-1.4 1.4l-11.9.7c-.8 0-1.2-.1-1.6-.6L3.2 19c-.4-.6-.6-1-.6-1.6V6c0-.7.3-1.2 1.4-1.4Zm10 1.7c-.2 0-.2.1-.1.3l.6.5c.1.1.2.1.4.1l6.5-.4c.1 0 .2-.1.1-.2l-.7-.5a1 1 0 0 0-.6-.2L14 6.3ZM7.7 9.5v9.6c0 .5.3.6.8.6l7.6-.5c.5 0 .6-.3.6-.7V9.6c0-.4-.2-.6-.6-.6l-8 .5c-.4 0-.5.2-.4.5l.4-.5Zm7.4 1c.1.5 0 1-.5 1l-.4.1v6c-.3.2-.6.3-.9.3-.4 0-.5-.1-.8-.5l-2.6-4v3.9l.8.2s0 .5-.6.5l-1.7.1c-.1-.1 0-.4.2-.5l.4-.1V11l-.6-.1c-.1-.5.2-.9.7-.9l1.8-.1 2.7 4.1v-3.6l-.7-.1Z" />
    </svg>
  );
}

export function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M5.04 15.17a2.53 2.53 0 1 1-2.52-2.53h2.52v2.53Zm1.27 0a2.53 2.53 0 0 1 5.05 0v6.31a2.53 2.53 0 0 1-5.05 0v-6.31ZM8.83 5.04a2.53 2.53 0 1 1 2.53-2.52v2.52H8.83Zm0 1.27a2.53 2.53 0 0 1 0 5.05H2.52a2.53 2.53 0 0 1 0-5.05h6.31ZM18.96 8.83a2.53 2.53 0 1 1 2.52 2.53h-2.52V8.83Zm-1.27 0a2.53 2.53 0 0 1-5.05 0V2.52a2.53 2.53 0 0 1 5.05 0v6.31ZM15.17 18.96a2.53 2.53 0 1 1-2.53 2.52v-2.52h2.53Zm0-1.27a2.53 2.53 0 0 1 0-5.05h6.31a2.53 2.53 0 0 1 0 5.05h-6.31Z" />
    </svg>
  );
}
