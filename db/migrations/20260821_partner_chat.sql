BEGIN;

CREATE TABLE IF NOT EXISTS pairfuel_partner_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid NOT NULL REFERENCES pairfuel_partnerships(id) ON DELETE CASCADE,
  sender_user_id text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pairfuel_partner_messages_partnership_time_idx
  ON pairfuel_partner_messages(partnership_id, created_at ASC);

CREATE INDEX IF NOT EXISTS pairfuel_partner_messages_sender_time_idx
  ON pairfuel_partner_messages(sender_user_id, created_at DESC);

COMMIT;
