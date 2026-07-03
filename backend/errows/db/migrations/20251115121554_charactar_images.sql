ALTER TABLE characters_images
  ADD generated_at TIMESTAMPTZ NULL;
ALTER TABLE characters_images
  DROP COLUMN thumbnail;
ALTER TABLE characters_images
  DROP COLUMN updated_at;