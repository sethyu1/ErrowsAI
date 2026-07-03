CREATE TABLE user_gifts (
  id                      UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  uid                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id           UUID NOT NULL,

  -- 有效期
  stv_tr                 TSTZRANGE NOT NULL
)