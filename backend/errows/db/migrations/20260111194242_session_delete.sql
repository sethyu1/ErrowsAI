-- Add deleted_at columns for soft delete
ALTER TABLE sessions
    ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE session_messages
    ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE session_personas
    ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create indexes to improve query performance when filtering deleted records
CREATE INDEX idx_sessions_deleted_at ON sessions(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_session_messages_deleted_at ON session_messages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_session_personas_deleted_at ON session_personas(deleted_at) WHERE deleted_at IS NULL;