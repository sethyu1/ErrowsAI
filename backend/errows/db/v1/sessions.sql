CREATE TABLE IF NOT EXISTS v1.session_personas (
  id                        UUID PRIMARY KEY NOT NULL DEFAULT GEN_RANDOM_UUID(),
  old_id                    BIGINT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS v1.sessions (
  id                UUID PRIMARY KEY NOT NULL DEFAULT GEN_RANDOM_UUID(),
  old_id            BIGINT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS v1.session_messages (
  id                UUID PRIMARY KEY NOT NULL DEFAULT GEN_RANDOM_UUID(),
  old_id            BIGINT UNIQUE NOT NULL
);