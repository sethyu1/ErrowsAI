CREATE TABLE user_login_log (
    user_id                   UUID NOT NULL,
    email                     VARCHAR(255) NOT NULL,
    action                    VARCHAR(50) NOT NULL,
    ip_address                INET,
    user_agent                TEXT,
    login_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提升查询性能
CREATE INDEX idx_user_login_log_user_id ON user_login_log(user_id);
CREATE INDEX idx_user_login_log_email ON user_login_log(email);
CREATE INDEX idx_user_login_log_login_at ON user_login_log(login_at DESC);