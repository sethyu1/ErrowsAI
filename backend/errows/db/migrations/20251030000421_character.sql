
CREATE TABLE characters (
  id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  owner_id                UUID NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'pending',
  avatar_url              TEXT,
  identity                JSONB NOT NULL,
  style                   JSONB NOT NULL,
  dialogue                JSONB NOT NULL,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);