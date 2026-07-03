CREATE TABLE members_plan(
  id                     UUID NOT NULL,
  plan                   VARCHAR(100) NOT NULL,
  subscription_id        VARCHAR(100),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	stv_tr                 TSTZRANGE NOT NULL,

  EXCLUDE USING GIST (id WITH =, stv_tr WITH &&)
);

ALTER TABLE members
  DROP COLUMN IF EXISTS plan,
  DROP COLUMN IF EXISTS valid_until;