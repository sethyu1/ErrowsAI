CREATE TABLE supports (
  id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  email                   CITEXT NOT NULL,
  type                    VARCHAR(100) NOT NULL,
  description             TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);