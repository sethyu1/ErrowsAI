ALTER TABLE posts
  ADD COLUMN status VARCHAR(20);

UPDATE posts
  SET status = 'published';

ALTER TABLE posts
  ALTER COLUMN status SET NOT NULL;