
CREATE TABLE session_personas (
  id                      UUID DEFAULT GEN_RANDOM_UUID(),
  uid                     UUID NOT NULL,
  name                    VARCHAR(100) NOT NULL,
  description             TEXT,

  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  UNIQUE(uid, id)
);

CREATE TABLE sessions (
  id                      UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  uid                     UUID NOT NULL,
  pid                     UUID NOT NULL,
  cid                     UUID NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'active',
  settings                JSONB NOT NULL,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  FOREIGN KEY (cid) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (uid, pid) REFERENCES session_personas(uid, id) ON DELETE CASCADE,
  UNIQUE(pid, cid)
);

CREATE TABLE session_messages (
  id                      UUID DEFAULT GEN_RANDOM_UUID(),
  sid                     UUID NOT NULL,
  role                    VARCHAR(50) NOT NULL,
  reply_to_id             UUID DEFAULT NULL,
  content                 TEXT NOT NULL,
  voice_url               TEXT DEFAULT NULL,
  image_url               TEXT DEFAULT NULL,
  feedback                VARCHAR(20) DEFAULT NULL,
  sended_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  edited_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  UNIQUE(sid, id),
  FOREIGN KEY (sid) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (sid, reply_to_id) REFERENCES session_messages(sid, id) ON DELETE SET NULL
);