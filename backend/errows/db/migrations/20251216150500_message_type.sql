ALTER TABLE session_messages
  ADD COLUMN type VARCHAR(20);

UPDATE session_messages
  SET type = 'text'
  WHERE type IS NULL AND image_url IS NULL;

UPDATE session_messages
  SET type = 'image'
  WHERE type IS NULL AND image_url IS NOT NULL;


ALTER TABLE session_messages
  ALTER COLUMN type SET NOT NULL;