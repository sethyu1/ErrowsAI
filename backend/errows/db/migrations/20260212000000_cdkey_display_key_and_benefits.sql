-- CD-Key: display key (8-char), validity window, and configurable benefits
-- display_key: user-facing 8-char code (alphanumeric)
-- valid_from / valid_to: key can only be redeemed within this window
-- benefit_plan, benefit_plan_start_days, benefit_plan_end_days: subscription benefit
-- benefit_coin_gold, benefit_coin_free: coin benefits

ALTER TABLE cd_keys
  ADD COLUMN IF NOT EXISTS display_key VARCHAR(8),
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_to TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS benefit_plan TEXT,
  ADD COLUMN IF NOT EXISTS benefit_plan_start_days INTEGER,
  ADD COLUMN IF NOT EXISTS benefit_plan_end_days INTEGER,
  ADD COLUMN IF NOT EXISTS benefit_coin_gold INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS benefit_coin_free INTEGER NOT NULL DEFAULT 0;

-- Backfill display_key from id (8 hex chars, unique per row)
UPDATE cd_keys
SET display_key = UPPER(SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 8))
WHERE display_key IS NULL;

-- Backfill validity from created_at and duration_days
UPDATE cd_keys
SET valid_from = COALESCE(valid_from, created_at),
    valid_to   = COALESCE(valid_to, created_at + (duration_days || ' days')::INTERVAL)
WHERE valid_from IS NULL OR valid_to IS NULL;

-- Backfill benefit fields from current plan/duration/coin_amount
UPDATE cd_keys
SET benefit_plan             = COALESCE(benefit_plan, plan),
    benefit_plan_start_days   = COALESCE(benefit_plan_start_days, 0),
    benefit_plan_end_days     = COALESCE(benefit_plan_end_days, duration_days),
    benefit_coin_free         = COALESCE(benefit_coin_free, coin_amount)
WHERE benefit_plan IS NULL OR benefit_plan_start_days IS NULL OR benefit_plan_end_days IS NULL OR (benefit_coin_free = 0 AND coin_amount > 0);

ALTER TABLE cd_keys
  ALTER COLUMN display_key SET NOT NULL;

ALTER TABLE cd_keys
  ALTER COLUMN valid_from SET DEFAULT NOW(),
  ALTER COLUMN valid_to SET DEFAULT (NOW() + INTERVAL '1 year');

-- Set NOT NULL for valid_from/valid_to after defaults
UPDATE cd_keys SET valid_from = COALESCE(valid_from, created_at) WHERE valid_from IS NULL;
UPDATE cd_keys SET valid_to = COALESCE(valid_to, created_at + INTERVAL '1 year') WHERE valid_to IS NULL;
ALTER TABLE cd_keys ALTER COLUMN valid_from SET NOT NULL;
ALTER TABLE cd_keys ALTER COLUMN valid_to SET NOT NULL;

-- Unique constraint on display_key
CREATE UNIQUE INDEX IF NOT EXISTS cd_keys_display_key_key ON cd_keys (display_key);
