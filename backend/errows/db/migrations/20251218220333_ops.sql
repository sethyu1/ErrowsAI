CREATE TABLE op_roles (
  id                          UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  builtin                     BOOLEAN NOT NULL DEFAULT FALSE,
  name                        TEXT NOT NULL UNIQUE,
  description                 TEXT,
  permissions                 TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO op_roles (name, builtin, description, permissions) VALUES
  ('sysadmin', true, '系统管理员，拥有所有权限，不能修改和删除', ARRAY[]::TEXT[])
ON CONFLICT (name) DO NOTHING;


CREATE TABLE op_user_roles (
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id                     UUID NOT NULL REFERENCES op_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);