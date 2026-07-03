CREATE TABLE gifts (
  id                        UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  picture_url               TEXT NOT NULL,
  name                      TEXT NOT NULL,
  price                     INTEGER NOT NULL,
  intimacy_points           INTEGER NOT NULL,
  prompt                    TEXT,

  need_claim                BOOLEAN NOT NULL DEFAULT FALSE,
  valid_days                INTEGER,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);