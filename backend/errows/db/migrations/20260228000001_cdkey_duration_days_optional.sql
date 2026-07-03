-- 有效天数改为可选：可兑换时间由 可兑换开始/结束时间 决定，duration_days 仅作兼容保留
ALTER TABLE cd_keys
  ALTER COLUMN duration_days SET DEFAULT 0;
