alter table scan_runs
  add column if not exists scan_mode text not null default 'new',
  add column if not exists total_filings_skipped integer not null default 0;

create table if not exists scan_events (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid not null references scan_runs(id) on delete cascade,
  event_type text not null,
  ticker text,
  target_company text,
  accession_number text,
  filing_date date,
  filing_url text,
  section_label text,
  signal_module text,
  keyword_matches text[] not null default '{}',
  classification text,
  confidence numeric,
  rationale text not null,
  created_at timestamptz not null default now()
);

alter table scan_events enable row level security;
