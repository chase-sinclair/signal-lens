# SignalLens AI Codex Memory

## Phase 0 - Repo + Next.js Foundation

### Summary
Replaced the interrupted Vite starter with a fresh Next.js App Router TypeScript application and added the first SignalLens shell.

### Decisions
- Use Next.js App Router with TypeScript, Tailwind CSS, ESLint, npm, and the `src/` directory.
- Keep the first UI as an operational product surface, not a marketing site.
- Track phase-by-phase implementation memory in this file.
- Use `main` as the working branch and GitHub remote `https://github.com/chase-sinclair/signal-lens.git`.

### Problems
- `create-next-app --force` would not overwrite the Vite files, so the disposable starter files were removed before scaffolding Next.js.

### Verification
- Next.js scaffold completed and generated route types successfully.

### Built
- Next.js foundation.
- Baseline SignalLens landing shell.
- Environment variable template.
- Project memory log.

### Next
- Add Supabase schema, seed data, and server-only Supabase helpers.

## Phase 1 - Data Model + Seed System

### Summary
Added the database contract and server-only integration layer for the CrowdStrike vertical slice.

### Decisions
- Store the full MVP schema in `supabase/schema.sql`.
- Keep seed data in `supabase/seed.sql` so a fresh Supabase project can be populated manually or through the CLI.
- Use a lazy service-role Supabase client so `next build` does not fail when environment variables are absent.
- Keep a TypeScript CrowdStrike profile mirror for UI and fallback display while Supabase is not configured.

### Problems
- Supabase credentials are not available in the local environment, so schema execution is documented but not applied from this machine.

### Verification
- `npm run lint` passed.

### Built
- MVP table schema with RLS enabled.
- CrowdStrike seed data and three reusable signal modules.
- Server-only Supabase service client helper.
- Shared TypeScript signal profile types.

### Next
- Build the dashboard workflow UI against local/server-provided data.

## Phase 2 - Dashboard Workflow UI

### Summary
Built the first operational SignalLens dashboard surface with local scan state and the review workflow.

### Decisions
- Implement the dashboard as a focused client component because ticker editing, selected brief state, copy actions, and status changes are interactive.
- Use a demo scan button for this phase so the UI can be reviewed before SEC and OpenAI plumbing is attached.
- Keep card radii at zero and use a restrained operations-console visual style.

### Problems
- Live scan execution is intentionally not connected in this phase.

### Verification
- `npm run lint` passed.
- `npm run build` passed.

### Built
- Seller profile panel.
- Target ticker textarea.
- Scan summary metrics.
- Brief list and detail panel.
- Status changes, copy outreach angle, and export full brief text.

### Next
- Add SEC ticker resolution, 8-K fetching, document parsing, and persistence.

## Phase 3 - SEC Fetch + Filing Parser

### Summary
Added the server-side SEC ingestion path for resolving tickers, fetching recent 8-K filings, parsing document HTML, chunking text, and persisting ingestion output.

### Decisions
- Use SEC's public ticker mapping and company submissions API directly.
- Limit each target to the three most recent 8-K filings in the first slice to protect demo latency and SEC fair-access posture.
- Require `SEC_USER_AGENT` before making SEC requests.
- Persist scan runs, target companies, filings, and chunks through server-only Supabase access.

### Problems
- Full ingestion cannot be exercised locally until Supabase env vars and seeded schema are available.
- Exhibit 99.1 discovery is deferred; the current implementation reliably fetches the primary 8-K document first.

### Verification
- `npm run lint` passed.
- `npm run build` passed after tightening SEC resolver return types.

### Built
- SEC ticker resolution.
- Recent 8-K metadata fetch.
- Primary document fetch.
- HTML-to-readable-text parser.
- Filing chunker.
- `/api/scan` route for ingestion.

### Next
- Add keyword prefiltering, boilerplate suppression, candidate persistence, and fixtures.
