CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS pairfuel_profiles (
  user_id text PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Friend',
  calorie_target integer NOT NULL DEFAULT 1900 CHECK (calorie_target >= 1200),
  protein_target integer NOT NULL DEFAULT 130 CHECK (protein_target >= 0),
  carb_target integer NOT NULL DEFAULT 190 CHECK (carb_target >= 0),
  fat_target integer NOT NULL DEFAULT 65 CHECK (fat_target >= 0),
  water_target integer NOT NULL DEFAULT 2500 CHECK (water_target >= 500),
  goal_weight numeric(6,2),
  diet_plans text[] NOT NULL DEFAULT ARRAY['Flexible / IIFYM']::text[],
  fasting_preset text NOT NULL DEFAULT '16:8',
  eating_window_start time NOT NULL DEFAULT '12:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pairfuel_food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  meal text NOT NULL DEFAULT 'Meal',
  food_name text NOT NULL,
  calories integer NOT NULL CHECK (calories >= 0),
  protein numeric(8,2) NOT NULL DEFAULT 0,
  carbs numeric(8,2) NOT NULL DEFAULT 0,
  fat numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pairfuel_food_user_time_idx ON pairfuel_food_logs(user_id, logged_at DESC);

CREATE TABLE IF NOT EXISTS pairfuel_weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  logged_on date NOT NULL DEFAULT current_date,
  weight numeric(6,2) NOT NULL CHECK (weight > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_on)
);

CREATE TABLE IF NOT EXISTS pairfuel_water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  logged_on date NOT NULL DEFAULT current_date,
  amount_ml integer NOT NULL DEFAULT 0 CHECK (amount_ml >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_on)
);

CREATE TABLE IF NOT EXISTS pairfuel_fasting_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  target_hours integer NOT NULL DEFAULT 16 CHECK (target_hours BETWEEN 1 AND 24),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pairfuel_fasting_user_time_idx ON pairfuel_fasting_sessions(user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS pairfuel_partner_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id text NOT NULL,
  code text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pairfuel_partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id text NOT NULL,
  user_b_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a_id <> user_b_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS pairfuel_partner_a_unique ON pairfuel_partnerships(user_a_id);
CREATE UNIQUE INDEX IF NOT EXISTS pairfuel_partner_b_unique ON pairfuel_partnerships(user_b_id);

CREATE TABLE IF NOT EXISTS pairfuel_partner_privacy (
  user_id text PRIMARY KEY,
  share_calories boolean NOT NULL DEFAULT true,
  share_macros boolean NOT NULL DEFAULT true,
  share_meals boolean NOT NULL DEFAULT true,
  share_fasting boolean NOT NULL DEFAULT true,
  share_water boolean NOT NULL DEFAULT true,
  share_weight boolean NOT NULL DEFAULT false,
  share_weight_change boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
