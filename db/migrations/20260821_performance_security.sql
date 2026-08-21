BEGIN;

ALTER TABLE pairfuel_partner_privacy
  ALTER COLUMN share_weight_change SET DEFAULT false;

WITH ranked_active_fasts AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY started_at DESC, created_at DESC) AS position
  FROM pairfuel_fasting_sessions
  WHERE ended_at IS NULL
)
UPDATE pairfuel_fasting_sessions AS sessions
SET ended_at=now()
FROM ranked_active_fasts AS ranked
WHERE sessions.id=ranked.id AND ranked.position>1;

CREATE UNIQUE INDEX IF NOT EXISTS pairfuel_one_active_fast_per_user_idx
  ON pairfuel_fasting_sessions(user_id)
  WHERE ended_at IS NULL;

CREATE TABLE IF NOT EXISTS pairfuel_ai_rate_limits (
  user_id text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
