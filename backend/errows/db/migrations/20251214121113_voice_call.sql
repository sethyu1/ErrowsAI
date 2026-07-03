CREATE TABLE session_voice_calls (
  id                     UUID NOT NULL PRIMARY KEY,
  sid                    UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  status                 VARCHAR(20) NOT NULL,
  summary                TEXT,
  start_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at               TIMESTAMPTZ
);

CREATE TABLE session_voice_call_segments (
  id                     UUID NOT NULL PRIMARY KEY,
  voice_call_id          UUID NOT NULL REFERENCES session_voice_calls(id) ON DELETE CASCADE,
  transcript_user        TEXT NOT NULL,
  transcript_character   TEXT[],
  summary                TEXT[],
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);