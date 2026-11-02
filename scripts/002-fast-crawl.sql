-- Manual "refresh now" cooldown per account.
ALTER TABLE crawl_accounts ADD COLUMN IF NOT EXISTS refreshed_at timestamptz;

-- Daily snapshots are now built from account totals + per-tank battle counts (buildFastAgg).
-- Rows from the old per-tank method would make period diffs inconsistent, so rebuild from scratch.
DELETE FROM account_snapshots;
UPDATE crawl_accounts SET battles = -1, next_check_at = now();
