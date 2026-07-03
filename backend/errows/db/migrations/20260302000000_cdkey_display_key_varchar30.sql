-- Ensure display_key allows 8-30 characters (in case 20260301000000 was not fully applied)
ALTER TABLE cd_keys ALTER COLUMN display_key TYPE VARCHAR(30);
