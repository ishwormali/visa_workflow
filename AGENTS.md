# AGENTS.md

## Scope

These instructions apply across the whole repository.

## Project Snapshot

- Stack: TanStack Start (full-stack React + Nitro server), React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (base-luma style), Base UI headless primitives.
- Routing is file-based under [src/routes](src/routes). The generated [src/routeTree.gen.ts](src/routeTree.gen.ts) is auto-produced by the router Vite plugin on every `dev`/`build` run — never edit it by hand. Router-wide config (scroll restoration, preload strategy) is in [src/router.tsx](src/router.tsx).
- Shared UI primitives live under [src/components/ui](src/components/ui). Each component wraps a Base UI headless primitive with `cva` variant definitions — use [src/components/ui/button.tsx](src/components/ui/button.tsx) as the reference pattern.
- Shared utility helpers live under [src/lib/utils.ts](src/lib/utils.ts).
- Styling uses Tailwind CSS v4 with an OKLch-based CSS variable theme (light/dark via `.dark` class selector) defined in [src/styles.css](src/styles.css). Prettier auto-sorts Tailwind classes via `prettier-plugin-tailwindcss`.
- To add a shadcn component: `npx shadcn@latest add [component]` — components land in `src/components/ui/`.

## Commands

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Tests: `pnpm test`
- Format: `pnpm format`

## Working Conventions

- Prefer minimal, typed changes that fit the current TanStack Start and React patterns already in the repo.
- Add new pages by creating route files in [src/routes](src/routes), not by editing the generated route tree.
- Keep router-wide behavior in [src/router.tsx](src/router.tsx) and document shell or head changes in [src/routes/\_\_root.tsx](src/routes/__root.tsx).
- Reuse `cn()` from [src/lib/utils.ts](src/lib/utils.ts) for Tailwind class composition.
- When extending UI primitives, follow the `cva` plus wrapper pattern used in [src/components/ui/button.tsx](src/components/ui/button.tsx).
- Use the `@/` path alias for imports from `src`.

## Validation

- Run `pnpm typecheck` after TypeScript or route changes.
- Run `pnpm lint` after broader component or styling edits.
- Run `pnpm test` only when adding or modifying tests. The repository currently has Vitest configured but no committed test files.

## Reference Docs

- See [README.md](README.md) for the existing shadcn component workflow.

## Pitfalls

- [src/routes/index.tsx](src/routes/index.tsx) is still starter content; do not treat it as a product requirement.
- [src/routes/\_\_root.tsx](src/routes/__root.tsx) includes devtools in the root shell. Preserve them unless the task explicitly removes or replaces them.
