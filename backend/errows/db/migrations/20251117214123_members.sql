CREATE TABLE members (
  id                            UUID PRIMARY KEY NOT NULL,
  plan                          VARCHAR(20) NOT NULL DEFAULT 'free',
  valid_until                   TIMESTAMP WITH TIME ZONE NOT NULL,
  coin_free_balance             INTEGER NOT NULL DEFAULT 0,
  coin_purchased_balance        INTEGER NOT NULL DEFAULT 0,
  created_at                    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
)