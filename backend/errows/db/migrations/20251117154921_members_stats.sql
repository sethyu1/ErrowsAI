CREATE TABLE members_stats (
  uid                     UUID NOT NULL,
  type                    TEXT NOT NULL,
  count                   INTEGER NOT NULL DEFAULT 0,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (uid, type)
)