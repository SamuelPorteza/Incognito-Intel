# Incognito Intel

  A digital classroom platform where students anonymously submit questions and teachers get real-time analytics on common learning struggles.

  ## Features

  - **Student view** — anonymous question submission with topic selector
  - **Teacher dashboard** — live stats, topic heatmap, recent questions feed, and burst alerts when a topic spikes
  - **Questions list** — full filterable list with the ability to mark questions addressed and write answers
  - **Answers page** — students browse teacher responses without needing an account
  - **Burst alerts** — automatic notification when 5+ questions arrive on the same topic within 10 minutes

  ## Stack

  - **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query, Recharts
  - **API**: Express 5, OpenAPI-first (Orval codegen)
  - **Database**: PostgreSQL + Drizzle ORM
  - **Validation**: Zod (`zod/v4`), drizzle-zod
  - **Monorepo**: pnpm workspaces, Node.js 24, TypeScript 5.9

  ## Project structure

  ```
  artifacts/
    api-server/       # Express API server
    incognito-intel/  # React + Vite frontend
  lib/
    api-spec/         # OpenAPI spec + Orval codegen config
    api-client-react/ # Generated TanStack Query hooks
    api-zod/          # Generated Zod schemas
    db/               # Drizzle ORM schema + migrations
  ```

  ## Getting started

  ### Prerequisites

  - Node.js 24+
  - pnpm 9+
  - PostgreSQL database

  ### 1. Install dependencies

  ```bash
  pnpm install
  ```

  ### 2. Set environment variables

  Create a `.env` file or export the following:

  ```bash
  DATABASE_URL=postgresql://user:password@localhost:5432/incognito_intel
  SESSION_SECRET=your-random-secret
  ```

  ### 3. Push the database schema

  ```bash
  pnpm --filter @workspace/db run push
  ```

  ### 4. Start the API server

  ```bash
  pnpm --filter @workspace/api-server run dev
  ```

  The API runs on port `8080` and is available at `/api`.

  ### 5. Start the frontend

  ```bash
  pnpm --filter @workspace/incognito-intel run dev
  ```

  The frontend runs on port `5173` by default. Open [http://localhost:5173](http://localhost:5173) in your browser.

  ## Pages

  | Path | Who | Description |
  |------|-----|-------------|
  | `/` | Students | Submit anonymous questions |
  | `/answers` | Students | Browse teacher responses |
  | `/dashboard` | Teachers | Analytics, heatmap, burst alerts |
  | `/questions` | Teachers | All questions, answer writing |

  ## Development commands

  ```bash
  # Full typecheck across all packages
  pnpm run typecheck

  # Regenerate API hooks and Zod schemas after changing openapi.yaml
  pnpm --filter @workspace/api-spec run codegen

  # Push DB schema changes (dev only)
  pnpm --filter @workspace/db run push
  ```

  ## Burst alert system

  The teacher dashboard polls `/api/analytics/alerts` every 30 seconds. An alert fires when any topic receives 5 or more questions within a rolling 10-minute window. Alerts appear as an amber banner on the dashboard, highlight the relevant bars in the heatmap, and show a badge on the sidebar navigation — all without requiring any configuration.

  Dismissed alerts are stored in `localStorage` so they don't reappear until new questions arrive after the dismissal.

  ## Anonymous by design

  Questions store no user identity. No login is required for students to submit questions or browse answers. The teacher portal is intentionally open for classroom demo use — authentication can be added on top of the existing session infrastructure if needed.
  