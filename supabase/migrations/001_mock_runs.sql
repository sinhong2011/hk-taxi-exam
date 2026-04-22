-- Anonymous leaderboard for hk-taxi-exam mock runs.
-- No auth — display_name is user-chosen at submit time, device_id is a
-- client-generated UUID persisted in localStorage for soft dedup/rate-limit.

create table if not exists public.mock_runs (
  id              uuid primary key default gen_random_uuid(),
  display_name    text not null check (length(display_name) between 1 and 20),
  part_a_correct  int  not null check (part_a_correct >= 0),
  part_a_total    int  not null check (part_a_total between 1 and 40),
  part_b_correct  int  not null check (part_b_correct >= 0),
  part_b_total    int  not null check (part_b_total between 1 and 35),
  verdict         text not null check (verdict in ('pass', 'fail')),
  duration_sec    int  not null check (duration_sec >= 0 and duration_sec <= 10800),
  device_id       uuid not null,
  created_at      timestamptz not null default now(),
  constraint valid_part_a check (part_a_correct <= part_a_total),
  constraint valid_part_b check (part_b_correct <= part_b_total)
);

-- RLS: public read + public insert (with server-side validation via check constraints).
-- No update, no delete from client.
alter table public.mock_runs enable row level security;

create policy "public read" on public.mock_runs
  for select using (true);

create policy "public insert" on public.mock_runs
  for insert with check (
    length(display_name) between 1 and 20
    and part_a_correct between 0 and part_a_total
    and part_b_correct between 0 and part_b_total
    and duration_sec between 0 and 10800
    and verdict in ('pass', 'fail')
  );

-- Leaderboard primary index: score DESC, time ASC (faster wins tiebreak), then most recent.
create index if not exists mock_runs_leaderboard_idx
  on public.mock_runs ((part_a_correct + part_b_correct) desc, duration_sec asc, created_at desc);

-- Device-ID lookup for "your submissions" highlighting.
create index if not exists mock_runs_device_idx
  on public.mock_runs (device_id, created_at desc);
