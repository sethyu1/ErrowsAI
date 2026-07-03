ALTER TABLE errows.characters
  ADD COLUMN IF NOT EXISTS greeting_image text,
  ADD COLUMN IF NOT EXISTS background_image_files text;


ALTER TABLE errows.characters
  ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}'::jsonb;


