CREATE TABLE post_comments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pid                     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reply_to_id             UUID REFERENCES post_comments(id) ON DELETE SET NULL,
    uid                     UUID NOT NULL,
    content                 TEXT NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);