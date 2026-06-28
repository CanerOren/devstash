# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev      # Start the dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Serve the production build
npm run lint     # ESLint (flat config, eslint-config-next)
npx tsc --noEmit # Type-check without emitting (no dedicated script)
npm test         # Run unit tests once (Vitest)
npm run test:watch # Run unit tests in watch mode
```

Unit tests use [Vitest](https://vitest.dev) (Node environment). We test **server
actions and utilities only** — not React components. Test files are colocated
next to the code as `*.test.ts` (e.g. `src/lib/auth/password-reset.test.ts`).

## Neon MCP Usage

When using the Neon MCP server for this project, **always** target:

- **Project:** `devstash` (`spring-bonus-52783735`)
- **Branch:** `development` (`br-lucky-wind-a2kpxofe`) — pass this `branchId` on every query

**Never touch the `production` branch** (`br-dry-sun-a2kqgxyf`, the default/primary branch)
unless I explicitly name production in my request. Because production is the *default*
branch, omitting `branchId` hits production — so never omit it; always pass the
`development` branch ID.

Confirm with me before running anything against production, even read-only.