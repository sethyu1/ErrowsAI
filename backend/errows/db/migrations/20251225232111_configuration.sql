CREATE TABLE configurations (
  scope                           TEXT NOT NULL,
  key                             TEXT NOT NULL,
  value                           JSONB NOT NULL,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (scope, key)
)