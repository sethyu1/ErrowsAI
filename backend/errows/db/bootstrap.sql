SET search_path TO public;

CREATE extension IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE extension IF NOT EXISTS citext WITH SCHEMA public;
create extension IF NOT EXISTS btree_gist WITH SCHEMA public;

CREATE TABLE IF NOT EXISTS schema_migrations (
  scope             TEXT NOT NULL,
  version           BIGINT NOT NULL,
  inserted_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  PRIMARY KEY (scope, version)
);