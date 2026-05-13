create extension if not exists pgcrypto;

create table if not exists seller_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pack text not null,
  description text not null,
  website text,
  created_at timestamptz not null default now()
);

create table if not exists signal_modules (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  default_keywords text[] not null default '{}',
  strong_trigger_examples text[] not null default '{}',
  weak_signal_examples text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists seller_company_profiles (
  id uuid primary key default gen_random_uuid(),
  seller_company_id uuid not null references seller_companies(id) on delete cascade,
  products_summary text not null,
  buyer_personas text[] not null default '{}',
  sales_motions text[] not null default '{}',
  outreach_sensitivity_rules text not null,
  created_at timestamptz not null default now(),
  unique (seller_company_id)
);

create table if not exists seller_company_signal_modules (
  id uuid primary key default gen_random_uuid(),
  seller_company_id uuid not null references seller_companies(id) on delete cascade,
  signal_module_id uuid not null references signal_modules(id) on delete cascade,
  custom_keywords text[] not null default '{}',
  custom_strong_triggers text[] not null default '{}',
  custom_weak_triggers text[] not null default '{}',
  priority_weight numeric not null default 1.0,
  created_at timestamptz not null default now(),
  unique (seller_company_id, signal_module_id)
);

create table if not exists target_companies (
  id uuid primary key default gen_random_uuid(),
  ticker text not null unique,
  cik text not null,
  name text not null,
  exchange text,
  sector text,
  industry text,
  created_at timestamptz not null default now()
);

create table if not exists monitored_targets (
  id uuid primary key default gen_random_uuid(),
  seller_company_id uuid not null references seller_companies(id) on delete cascade,
  target_company_id uuid not null references target_companies(id) on delete cascade,
  active boolean not null default true,
  last_checked_at timestamptz,
  last_filing_seen_accession text,
  created_at timestamptz not null default now(),
  unique (seller_company_id, target_company_id)
);

create index if not exists monitored_targets_active_idx
  on monitored_targets (seller_company_id, active);

create table if not exists filings (
  id uuid primary key default gen_random_uuid(),
  target_company_id uuid not null references target_companies(id) on delete cascade,
  accession_number text not null,
  filing_type text not null,
  filing_date date not null,
  report_date date,
  sec_url text not null,
  primary_document_url text,
  raw_text_path_or_blob text,
  created_at timestamptz not null default now(),
  unique (target_company_id, accession_number)
);

create table if not exists filing_chunks (
  id uuid primary key default gen_random_uuid(),
  filing_id uuid not null references filings(id) on delete cascade,
  chunk_index integer not null,
  section_label text,
  text text not null,
  source_url text not null,
  created_at timestamptz not null default now(),
  unique (filing_id, chunk_index)
);

create table if not exists scan_runs (
  id uuid primary key default gen_random_uuid(),
  seller_company_id uuid not null references seller_companies(id) on delete cascade,
  run_type text not null default 'manual',
  scan_mode text not null default 'new',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running',
  total_filings_scanned integer not null default 0,
  total_filings_skipped integer not null default 0,
  total_candidates integer not null default 0,
  total_briefs_generated integer not null default 0,
  total_filings_suppressed integer not null default 0
);

create table if not exists scan_events (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid not null references scan_runs(id) on delete cascade,
  candidate_id uuid references signal_candidates(id) on delete set null,
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

create table if not exists signal_candidates (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid not null references scan_runs(id) on delete cascade,
  filing_id uuid not null references filings(id) on delete cascade,
  chunk_id uuid references filing_chunks(id) on delete set null,
  seller_company_id uuid not null references seller_companies(id) on delete cascade,
  signal_module_id uuid references signal_modules(id) on delete set null,
  prefilter_keyword_matches text[] not null default '{}',
  llm_classification text,
  llm_confidence numeric,
  rationale text,
  created_at timestamptz not null default now()
);

create table if not exists briefs (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid not null references scan_runs(id) on delete cascade,
  seller_company_id uuid not null references seller_companies(id) on delete cascade,
  target_company_id uuid not null references target_companies(id) on delete cascade,
  filing_id uuid not null references filings(id) on delete cascade,
  source_candidate_id uuid references signal_candidates(id) on delete set null,
  title text not null,
  trigger_type text not null,
  urgency text not null,
  confidence_score numeric not null,
  evidence_snippet text not null,
  why_it_matters text not null,
  buyer_personas text[] not null default '{}',
  suggested_sales_motion text not null,
  suggested_outreach_angle text not null,
  outreach_sensitivity text not null,
  recommended_next_step text not null,
  why_flagged text not null,
  status text not null default 'New',
  created_at timestamptz not null default now()
);

create table if not exists user_feedback (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  rating integer,
  relevant_boolean boolean,
  feedback_text text,
  created_at timestamptz not null default now()
);

alter table seller_companies enable row level security;
alter table signal_modules enable row level security;
alter table seller_company_profiles enable row level security;
alter table seller_company_signal_modules enable row level security;
alter table target_companies enable row level security;
alter table monitored_targets enable row level security;
alter table filings enable row level security;
alter table filing_chunks enable row level security;
alter table scan_runs enable row level security;
alter table scan_events enable row level security;
alter table signal_candidates enable row level security;
alter table briefs enable row level security;
alter table user_feedback enable row level security;
