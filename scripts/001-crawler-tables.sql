CREATE TABLE IF NOT EXISTS account_snapshots (
  region text NOT NULL,
  account_id bigint NOT NULL,
  day date NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  agg double precision[] NOT NULL,
  PRIMARY KEY (region, account_id, day)
);
CREATE INDEX IF NOT EXISTS account_snapshots_day_idx ON account_snapshots (day);

CREATE TABLE IF NOT EXISTS crawl_accounts (
  region text NOT NULL,
  account_id bigint NOT NULL,
  nickname text NOT NULL,
  battles integer NOT NULL DEFAULT -1,
  last_battle_at timestamptz,
  next_check_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (region, account_id)
);
CREATE INDEX IF NOT EXISTS crawl_accounts_due_idx ON crawl_accounts (region, next_check_at);

CREATE TABLE IF NOT EXISTS crawl_state (
  key text PRIMARY KEY,
  cursor bigint NOT NULL,
  empty_streak integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Every player ever searched on the site joins the crawler queue.
INSERT INTO crawl_accounts (region, account_id, nickname)
SELECT region, account_id, nickname FROM players
ON CONFLICT DO NOTHING;
