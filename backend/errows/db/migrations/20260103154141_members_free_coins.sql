CREATE TABLE members_coins (
  id                             UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  uid                            UUID NOT NULL,
  type                           VARCHAR(50) NOT NULL,
  amount                         INTEGER NOT NULL,
  spend_amount                   INTEGER NOT NULL DEFAULT 0,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  stv_tr                         TSTZRANGE NOT NULL
);

CREATE INDEX idx_members_coins_uid ON members_coins (uid);
CREATE INDEX idx_members_coins_stv_tr ON members_coins USING GIST (stv_tr);
CREATE INDEX idx_members_coins_type ON members_coins (type);

INSERT INTO members_coins (uid, type, amount, stv_tr)
SELECT
  id AS uid,
  'purchased' AS type,
  coin_purchased_balance AS amount,
  TSTZRANGE(NOW(), 'infinity') AS stv_tr
FROM members
WHERE coin_purchased_balance > 0;

DROP TABLE members;