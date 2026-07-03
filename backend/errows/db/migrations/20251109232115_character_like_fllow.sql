CREATE TABLE characters_likes (
  cid                     UUID NOT NULL,
  uid                     UUID NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (cid, uid),
  FOREIGN KEY (cid) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE TABLE characters_follows (
  cid                     UUID NOT NULL,
  uid                     UUID NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (cid, uid),
  FOREIGN KEY (cid) REFERENCES characters(id) ON DELETE CASCADE
);

ALTER TABLE characters ADD COLUMN social JSONB NOT NULL DEFAULT '{}'::JSONB;