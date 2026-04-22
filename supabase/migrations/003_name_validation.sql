-- Display-name hardening — server-side safety net against direct-API abuse.
--
-- Client-side validation in Mock.tsx confirmName() is the friendly layer
-- (character class filter + anti-impersonation blocklist + helpful error
-- messages). Anyone calling the Supabase REST endpoint directly would
-- bypass that, so the DB must refuse obvious bad input too.
--
-- What we enforce here:
--   1. No ASCII control chars (\x00-\x1F, \x7F) — stops NUL injection,
--      log-corruption attacks, CR/LF header splitting, tab smuggling.
--   2. No leading or trailing whitespace — prevents invisible-padding
--      games like "   admin" sorting next to "admin".
--   3. Must have at least one non-whitespace char — redundant with (2)
--      for length > 0 but explicit for future auditors.
--
-- Not enforced server-side (client only): emoji filter, impersonation
-- blocklist. Those are judgment calls with false-positive risk; better
-- owned by the UI where we can iterate without a migration.

alter table public.mock_runs
  add constraint display_name_format
    check (
      display_name = trim(display_name)
      and display_name ~ '[^[:space:]]'
      and display_name !~ '[\x00-\x1F\x7F]'
    );

-- Rate limit: same device_id can submit at most once per 30 seconds.
-- A mock run takes ~45 minutes so 30s never blocks a legitimate flow. The
-- check is advisory — device_id regenerates on localStorage clear, so a
-- motivated attacker can rotate. The goal here is to stop "F5 spam" and
-- accidental double-submits, not to defeat adversaries.
create or replace function public.mock_run_rate_ok(p_device_id uuid)
  returns boolean
  language sql
  stable
as $$
  select not exists (
    select 1
    from public.mock_runs
    where device_id = p_device_id
      and created_at > now() - interval '30 seconds'
  )
$$;

-- Re-create the insert policy so anon clients hit the new rules before
-- they even reach the table's CHECK (nicer error path + explicit policy).
drop policy if exists "public insert" on public.mock_runs;

create policy "public insert" on public.mock_runs
  for insert with check (
    length(display_name) between 1 and 20
    and display_name = trim(display_name)
    and display_name ~ '[^[:space:]]'
    and display_name !~ '[\x00-\x1F\x7F]'
    and part_a_correct between 0 and part_a_total
    and part_b_correct between 0 and part_b_total
    and duration_sec between 0 and 10800
    and verdict in ('pass', 'fail')
    and public.mock_run_rate_ok(device_id)
  );
