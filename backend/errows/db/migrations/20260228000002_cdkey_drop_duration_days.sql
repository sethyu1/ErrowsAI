-- Remove duration_days; key validity is fully determined by valid_from / valid_to
ALTER TABLE cd_keys
  DROP COLUMN IF EXISTS duration_days;
