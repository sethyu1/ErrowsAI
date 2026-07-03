-- CD-Key: usage type (one_time | multiple), max_redemptions; display_key extended to VARCHAR(30) for 8-30 char codes
-- Redemptions for multiple-use keys stored in cd_key_redemptions

-- Drop name column if it was added in a previous run (we use display_key 8-30 instead)
ALTER TABLE cd_keys DROP COLUMN IF EXISTS name;

ALTER TABLE cd_keys
  ADD COLUMN IF NOT EXISTS usage_type VARCHAR(20) NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS max_redemptions INTEGER NULL;

-- Extend display_key from VARCHAR(8) to VARCHAR(30) for customizable 8-30 char codes
ALTER TABLE cd_keys ALTER COLUMN display_key TYPE VARCHAR(30);

UPDATE cd_keys SET usage_type = 'one_time' WHERE usage_type IS NULL;

-- One display_key can be shared for multiple-use; one_time keys keep unique display_key per row
COMMENT ON COLUMN cd_keys.usage_type IS 'one_time: single redemption; multiple: same code redeemable up to max_redemptions times';
COMMENT ON COLUMN cd_keys.max_redemptions IS 'For usage_type=multiple only: max number of users who can redeem this key';

-- Redemptions for multiple-use CD keys (one row per user redemption)
CREATE TABLE IF NOT EXISTS cd_key_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cd_key_id UUID NOT NULL REFERENCES cd_keys(id) ON DELETE CASCADE,
  uid UUID NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cd_key_id, uid)
);

CREATE INDEX IF NOT EXISTS idx_cd_key_redemptions_cd_key_id ON cd_key_redemptions (cd_key_id);
CREATE INDEX IF NOT EXISTS idx_cd_key_redemptions_uid ON cd_key_redemptions (uid);
