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
