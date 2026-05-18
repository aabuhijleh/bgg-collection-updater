# AGENTS.md

This files provides guidance to AI coding assistants working in this project.

Note: CLAUDE.md is a symlink to this file.

## Project Overview

Local web app that bulk-adds board games to a user's BoardGameGeek collection. Two main capabilities:
1. **Name-to-ID search** -- search game names against BGG XML API2 to resolve BGG IDs
2. **Bulk collection upload** -- add games to BGG collection via Playwright browser automation

Single page app with four phases: Settings -> Input -> Search Results -> Add to Collection.

## Architecture

- **Frontend:** React 19 (with React Compiler), TanStack Router (file-based), TanStack Query, TanStack Table, shadcn/ui + Tailwind CSS 4
- **Server:** TanStack Start server functions (`createServerFn`) for RPC, server route handlers for SSE streaming
- **Browser automation:** Playwright (headless Chromium) for BGG login and collection management
- **Config:** Stored at `~/.bgg-collection-updater.json` (username, password, apiToken)

## Critical Flows

### BGG XML API2 (Search)
- Endpoint: `GET /xmlapi2/search?query={name}&type=boardgame` with `Authorization: Bearer {token}`
- Rate limit: 750ms delay between calls. On 429: wait 30s, auto-retry.
- Match logic: 0 results = not_found, 1 result = auto-accept, 2+ = check exact name match, otherwise ambiguous (user picks)
- Details endpoint for disambiguation: `GET /xmlapi2/thing?id={ids}` (max 20 per request)

### Playwright Collection Upload
- Login at `boardgamegeek.com/login`, handle cookie consent, fill credentials, verify title change
- Scan existing collection pages to get owned game IDs (always done, prevents duplicates)
- For each new game: navigate to game page, click visible "Add To Collection" button, check "Own", save
- Progress streamed via SSE from server route to frontend

### SSE Streaming
- Two SSE endpoints: `/api/search` (search results) and `/api/add-to-collection` (add progress)
- Events: `login`, `collection-scanned`, `game-adding`, `game-added`, `game-failed`, `game-skipped`, `done`

## Project Structure

```
src/
├── routes/                     # TanStack Router file-based routes
│   ├── __root.tsx              # Root layout
│   ├── index.tsx               # Main single-page app
│   └── api/                    # Server route handlers (SSE endpoints)
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
- shadcn components preferred over custom. TanStack Table for all data tables.
- **Tailwind sizing:** Use `size-x` instead of `h-x w-x` for square dimensions. Never add `className="mr-2 h-4 w-4"` or similar sizing/spacing to icons inside `<Button>` or `<TabsTrigger>` — the component handles it.

## Testing

- Unit: XML parsing, CSV parsing, name matching, Zod schemas
- Component: form behavior, table rendering, disambiguation, progress updates
- NOT tested: Playwright against real BGG (requires real credentials, too slow)
