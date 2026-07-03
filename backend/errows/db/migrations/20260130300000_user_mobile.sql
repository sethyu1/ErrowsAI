CREATE TABLE IF NOT EXISTS user_mobile (
    uid UUID NOT NULL,
    mobile VARCHAR(32) NOT NULL,
    verify_code VARCHAR(16),
    verified_at TIMESTAMP WITH TIME ZONE,
    code_gen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (uid),
    UNIQUE (mobile)
);

CREATE INDEX IF NOT EXISTS idx_user_mobile_mobile ON user_mobile (mobile);
