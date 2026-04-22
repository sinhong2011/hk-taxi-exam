-- One-shot cleanup of a CLI verification row inserted during setup.
delete from public.mock_runs where display_name = 'cli-probe';
