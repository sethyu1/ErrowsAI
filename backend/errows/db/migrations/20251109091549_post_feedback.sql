
CREATE TABLE IF NOT EXISTS post_feedback (
  uid                     UUID NOT NULL,
  pid                     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  feedback                VARCHAR(20) NOT NULL,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  PRIMARY KEY (uid, pid, feedback)
);

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS social     JSONB DEFAULT '{}' NOT NULL;