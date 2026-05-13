alter table monitored_targets
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_filing_seen_accession text;

create index if not exists monitored_targets_active_idx
  on monitored_targets (seller_company_id, active);
