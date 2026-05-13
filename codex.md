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
