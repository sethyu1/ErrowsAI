
CREATE TABLE user_archive (
  id                          UUID PRIMARY KEY,
  email                       CITEXT NOT NULL,
  name                        TEXT,
  profile                     JSONB,
  archived_at                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);