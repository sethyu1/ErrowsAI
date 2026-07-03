ALTER TABLE members
  ADD CONSTRAINT coin_payment_non_negative CHECK (coin_purchased_balance >= 0);

CREATE TABLE cd_keys (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key                TEXT NOT NULL UNIQUE,
  plan               TEXT NOT NULL,
  duration_days      INTEGER NOT NULL,
  coin_amount        INTEGER NOT NULL,
  created_by         UUID NOT NULL,
  redeemed_by        UUID,
  redeemed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE members_coin_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid                UUID NOT NULL,
  amount             INTEGER NOT NULL,
  reason             TEXT NOT NULL,
  cause_id           UUID NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);