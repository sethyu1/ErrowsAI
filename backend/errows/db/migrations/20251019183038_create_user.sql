-- Write your migration SQL here

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  name            TEXT,
  profile         JSONB,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE user_email (
  uid             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email           CITEXT UNIQUE NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  verify_code     VARCHAR(128),
  verified_at     TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  code_gen_at     TIMESTAMP WITH TIME ZONE
);

CREATE TABLE user_password (
  uid             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  hash            TEXT NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);