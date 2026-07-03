
CREATE TABLE characters_images (
  id                            UUID  PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  cid                           UUID NOT NULL,
  uid                           UUID NOT NULL,
  url                           TEXT NOT NULL,
  thumbnail                     TEXT NOT NULL,
  source                        TEXT NOT NULL,
  created_at                    TIMESTAMPTZ DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id                            UUID  PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  cid                           UUID NOT NULL,
  uid                           UUID NOT NULL,
  subject                       TEXT NOT NULL,
  content                       TEXT NOT NULL,
  images                        UUID[] DEFAULT '{}'::UUID[] NOT NULL,
  created_at                    TIMESTAMPTZ DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ DEFAULT NOW()
)