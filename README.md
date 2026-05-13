# SignalLens AI

SignalLens AI is a company-aware SEC filing signal agent. The MVP vertical slice lets a user select CrowdStrike, enter target tickers, scan official SEC 8-K filings, suppress weak filings, and generate evidence-backed Sales Action Briefs only when a filing creates a meaningful CrowdStrike sales action.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase/Postgres
- OpenAI Responses API structured outputs
- SEC EDGAR public APIs

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SEC_USER_AGENT=SignalLens AI your-email@example.com
```

The SEC requires declared automated access. Use a real contact email in `SEC_USER_AGENT`.

3. Apply Supabase schema and seed:

```bash
# Run these SQL files in the Supabase SQL editor or via your preferred SQL workflow.
supabase/schema.sql
supabase/seed.sql
```

4. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run lint
npm run build
npm run test:signals
```

## MVP Flow

1. Open the dashboard.
2. Confirm seller company is CrowdStrike.
3. Enter target tickers.
4. Run Scan.
5. The server resolves tickers to CIKs, fetches recent 8-K filings, parses filing text, runs deterministic prefiltering, classifies candidate chunks with OpenAI, and stores briefs in Supabase.
6. Review generated briefs, update status, copy outreach angle, or export full brief text.

## How to Demo SignalLens

Use **Fixture** scan mode when you need a guaranteed brief for a live demo. It returns a deterministic CrowdStrike cybersecurity incident example without relying on fresh SEC data.

Use **New only** for the production-like monitoring behavior. Already-seen accession numbers are skipped.

Use **Reprocess** for tuning and debugging recent filings that were already stored.

## Notes

- The demo result button works without credentials and previews the review workflow.
- The live scan requires Supabase schema/seed, Supabase env vars, OpenAI key, and SEC user agent.
- `codex.md` is the implementation memory log. It records phase summaries, decisions, problems, verification, and next steps.
