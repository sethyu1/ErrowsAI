CREATE TABLE user_task_progress (
  id                             UUID NOT NULL,
  uid                            UUID NOT NULL,
  progress                       NUMERIC NOT NULL DEFAULT 0,

  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at                   TIMESTAMPTZ,
  claimed_at                     TIMESTAMPTZ,

  -- Time span during which the task is active from day start to day end
  stv_tr                         TSTZRANGE NOT NULL DEFAULT TSTZRANGE(
    DATE_TRUNC('day', NOW()),
    DATE_TRUNC('day', NOW()) + INTERVAL '1 day',
    '[)'
  ),

  EXCLUDE USING GIST (id WITH =, uid WITH =, stv_tr WITH &&)
)