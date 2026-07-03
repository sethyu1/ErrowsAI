CREATE TABLE purchase (
  id                                          UUID NOT NULL PRIMARY KEY,
  uid                                         UUID NOT NULL,
  product_id                                  UUID NOT NULL,
  status                                      VARCHAR(20) NOT NULL,
  response                                    JSONB,
  callback                                    JSONB,
  created_at                                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);