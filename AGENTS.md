# AGENTS.md

This files provides guidance to AI coding assistants working in this project. Read it in full before making any changes.

Note: CLAUDE.md is a symlink to this file.

**Self-maintaining:** After any meaningful change to the project (new conventions, architectural shifts, updated flows), update this file with concise edits to keep it accurate. Only update when applicable — not every code change warrants a doc change.

## Project Overview

Local web app that bulk-adds board games to a user's BoardGameGeek collection. Two main capabilities:

1. **Name-to-ID search** -- search game names via BGG Scan API proxy to resolve BGG IDs
2. **Bulk collection upload** -- add games to BGG collection via Playwright browser automation

Single page app with four phases: Settings -> Input -> Search Results -> Add to Collection.

## Architecture

- **Frontend:** React 19 (with React Compiler), TanStack Router (file-based), TanStack Query, TanStack Table, shadcn/ui + Tailwind CSS 4
- **Server:** TanStack Start server functions (`createServerFn`) for RPC, server route handler for SSE streaming (collection only)
- **Browser automation:** Playwright (headless Chromium) for BGG login and collection management
- **Config:** Stored at `~/.bgg-collection-updater.json` (username, password)

## Critical Flows

### BGG Scan API (Search)

- Proxied via BGG Scan: `GET https://bgg-scan.aabuhijleh.com/api/bgg/search?name={name}` and `/api/bgg/details?ids={ids}`
- Server function calls bgg-scan API; client loops sequentially with exponential backoff
- Backoff: 10s × 2^attempt (max 3 retries). Inter-request delay: 2s normal, 15s after rate limit
- Match logic: 0 results = not_found, 1 result = auto-accept, 2+ = check exact name match, otherwise ambiguous (user picks)
- Details endpoint for disambiguation: max 20 IDs per request

### Playwright Collection Upload

- Login at `boardgamegeek.com/login`, handle cookie consent, fill credentials, verify title change
- Scan existing collection pages to get owned game IDs (always done, prevents duplicates)
- For each new game: navigate to game page, click visible "Add To Collection" button, check "Own", save
- Progress streamed via SSE from server route to frontend

### SSE Streaming (Collection Only)

- SSE endpoint: `/api/add-to-collection` (add progress)
- Events: `login`, `collection-scanned`, `game-adding`, `game-added`, `game-failed`, `game-skipped`, `done`

## Project Structure

```text
src/
├── routes/                     # TanStack Router file-based routes
│   ├── __root.tsx              # Root layout
│   ├── index.tsx               # Main single-page app
│   └── api/                    # Server route handlers (SSE endpoint for collection)
├── features/                   # Feature modules (self-contained: server/hooks/UI)
│   ├── config/                 # Settings management
│   ├── search/                 # Name-to-ID search
│   └── collection/             # Playwright collection upload
├── lib/                        # Shared utilities (BGG API helpers, CSV parsing)
└── components/ui/              # shadcn components
```

## Conventions

- **Always use `bun` and `bunx`.** Never use `npm`, `npx`, `yarn`, `pnpm`, or any other package manager/runner.
- Feature folders are self-contained: `*.server.ts` (server functions), `use-*.ts` (hooks), `*.tsx` (UI)
- React Query: custom hooks wrapping useQuery/useMutation, queryOptions helper, staleTime: Infinity for stable data
- No useEffect unless escape hatch. No useMemo/useCallback (React Compiler handles it).
- Zod for all validation. Biome for linting/formatting. Vitest + Testing Library for tests.
- **Forms:** TanStack Form (`useForm`) with Zod validators and shadcn Field components (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`). Use `form.Field` render props for field binding. See [shadcn TanStack Form docs](https://ui.shadcn.com/docs/forms/tanstack-form).
- shadcn components preferred over custom. TanStack Table for all data tables.
- **Tailwind sizing:** Use `size-x` instead of `h-x w-x` for square dimensions. Never add `className="mr-2 h-4 w-4"` or similar sizing/spacing to icons inside `<Button>` or `<TabsTrigger>` — the component handles it.
- **Accessibility:** Icon-only buttons (`size="icon"`) must include a `<span className="sr-only">` with a descriptive label.

## Testing

- Unit: BGG API calls (mocked), CSV parsing, Zod schemas
- Component: form behavior, table rendering, disambiguation, progress updates
- NOT tested: Playwright against real BGG (requires real credentials, too slow)
