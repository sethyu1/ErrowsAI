-- Drop the content column, then rename subject to content.
-- All post text is stored in subject; after this, it will be in content only.
ALTER TABLE posts DROP COLUMN IF EXISTS content;
ALTER TABLE posts RENAME COLUMN subject TO content;
ALTER TABLE posts ALTER COLUMN content SET NOT NULL;
