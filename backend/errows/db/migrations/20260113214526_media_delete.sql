ALTER TABLE characters_images
  ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE characters_videos
  ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_characters_images_deleted_at ON characters_images(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_characters_videos_deleted_at ON characters_videos(deleted_at) WHERE deleted_at IS NULL;