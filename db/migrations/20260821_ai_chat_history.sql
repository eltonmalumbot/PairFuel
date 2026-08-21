BEGIN;

CREATE TABLE IF NOT EXISTS pairfuel_ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL CHECK (char_length(content) <= 5000),
  estimate jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pairfuel_ai_messages_user_time_idx
  ON pairfuel_ai_messages(user_id, created_at DESC);

COMMIT;
