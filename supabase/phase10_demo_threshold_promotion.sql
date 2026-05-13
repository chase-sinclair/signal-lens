alter table scan_events
  add column if not exists candidate_id uuid references signal_candidates(id) on delete set null;

alter table briefs
  add column if not exists source_candidate_id uuid references signal_candidates(id) on delete set null;
