ALTER TABLE purchase
    ADD COLUMN session_id VARCHAR(255) UNIQUE NOT NULL,
    DROP COLUMN callback;

CREATE TABLE stripe_events (
    event                     JSONB NOT NULL,
    created_at                TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);