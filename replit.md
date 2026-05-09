# Incognito Intel

A digital classroom platform where students anonymously submit questions and teachers get real-time analytics on common learning struggles.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/incognito-intel run dev` — run the frontend (port 20692)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema (topics.ts, questions.ts)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/incognito-intel/src/` — React frontend

## Architecture decisions

- Anonymous by design: questions store no user identity; no auth required for student submission
- OpenAPI-first: all endpoints defined in openapi.yaml before implementation
- Teacher portal accessible at `/dashboard` and `/questions` without authentication (suitable for classroom demo; can add auth later)
- Heatmap uses bar chart (Recharts) with color intensity proportional to question volume
- Topics are pre-seeded with common math subjects; teachers can add more via the questions page

## Product

- **Student view** (`/`): Anonymous question submission with topic selector. "Slip it under the door" submit button.
- **Teacher dashboard** (`/dashboard`): Summary stats (total questions, top struggle, active topics), topic heatmap bar chart, recent questions feed.
- **Questions list** (`/questions`): Full filterable list of all anonymous questions; ability to add new topics.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` after adding new schema files to `lib/db/src/schema/` before typechecking leaf packages
- After each OpenAPI spec change, re-run `pnpm --filter @workspace/api-spec run codegen`
- The `lib/db` package uses Drizzle; schema changes require `pnpm --filter @workspace/db run push` to apply to the dev database

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
