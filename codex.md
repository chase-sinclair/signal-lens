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

## Phase 4 - Keyword Prefilter + Suppression

### Summary
Added deterministic signal filtering so the system creates candidates only when filing chunks match CrowdStrike signal modules and are not boilerplate-only risk language.

### Decisions
- Keep prefiltering pure and testable in `src/lib/signal-prefilter.ts`.
- Suppress generic risk-factor language even when it contains cyber keywords.
- Persist one signal candidate per non-boilerplate module match.

### Problems
- Prefiltering is intentionally conservative; some subtle but real cyber governance signals may wait for later tuning.
- Initial fixture showed boilerplate phrases were not keyword-detectable, so weak-risk phrases were added to the keyword set and then suppressed by the boilerplate classifier.

### Verification
- Added `npm run test:signals` fixture check for boilerplate suppression and concrete breach detection.
- `npm run test:signals` passed.
- `npm run lint` passed.
- `npm run build` passed.

### Built
- CrowdStrike keyword prefilter.
- Boilerplate classifier.
- Candidate persistence during ingestion.
- Signal fixture test script.

### Next
- Add OpenAI structured classification and brief generation for persisted candidates.

## Phase 5 - OpenAI Classification + Brief Generation

### Summary
Added the required OpenAI structured-output path. Candidate chunks now go through LLM classification and only actionable or high-urgency results generate stored briefs.

### Decisions
- Use OpenAI Responses API with strict JSON schema outputs.
- Keep classification and brief generation separate so suppression remains explicit.
- Fail the scan with a clear error if `OPENAI_API_KEY` is missing.
- Default `OPENAI_MODEL` to `gpt-5.5`.

### Problems
- Live OpenAI execution cannot be verified locally without an API key.
- Lint rejected a local variable named `module`, so it was renamed to `signalModule`.

### Verification
- `npm run test:signals` passed.
- `npm run lint` passed.
- `npm run build` passed.

### Built
- Structured classification schema.
- Structured Sales Action Brief schema.
- Candidate LLM result persistence.
- Brief generation and Supabase persistence for actionable/high-urgency candidates.

### Next
- Connect the dashboard to the real scan route and load persisted briefs into the review workflow.

## Phase 6 - End-to-End Review Workflow

### Summary
Connected the dashboard to the real scan API and added persisted brief status updates.

### Decisions
- Keep the demo result available as a separate preview button so the UI remains inspectable without credentials.
- Make `Run Scan` call the live `/api/scan` route.
- Optimistically update brief status in the UI, then persist through `/api/briefs/[id]/status`.

### Problems
- Live end-to-end scan still requires Supabase, OpenAI, and SEC user-agent environment variables.

### Verification
- `npm run test:signals` passed.
- `npm run lint` passed.
- `npm run build` passed.

### Built
- Live scan button integration.
- Loading and error states.
- Real generated briefs returned from the scan route.
- Persisted status update API route.

### Next
- Polish setup docs, run final verification, and browser-check the dashboard.

## Phase 7 - Polish + Verification Pass

### Summary
Added setup documentation and completed final local verification for the MVP vertical slice.

### Decisions
- Keep README focused on setup, environment variables, schema/seed application, scripts, and the MVP flow.
- Keep the demo result path because it allows UI review without live credentials.

### Problems
- Live SEC/OpenAI/Supabase scan was not run because credentials are not present in the local environment.
- Port 3000 was already serving another local app, so browser verification used `http://localhost:3100`.

### Verification
- `npm run test:signals` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Browser check passed at `http://localhost:3100`: dashboard loaded, demo result button generated a brief, copy/export controls appeared, and no console errors were reported.
- Mobile viewport check at 390x844 confirmed core dashboard sections are present with no console errors.

### Built
- README setup and operating instructions.
- Final project memory entry.

### Next
- Provide credentials, apply schema/seed in Supabase, and run a live scan.
