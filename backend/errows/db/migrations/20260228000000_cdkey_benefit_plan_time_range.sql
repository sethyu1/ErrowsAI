-- 权益-订阅改为时间范围：开始时间、结束时间（替代按“天数”相对兑换日）
ALTER TABLE cd_keys
  ADD COLUMN IF NOT EXISTS benefit_plan_valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS benefit_plan_valid_to TIMESTAMPTZ;

-- 可选：用现有天数反推时间范围，便于旧 key 兼容
UPDATE cd_keys
SET benefit_plan_valid_from = COALESCE(benefit_plan_valid_from, created_at),
    benefit_plan_valid_to   = COALESCE(benefit_plan_valid_to, created_at + (COALESCE(benefit_plan_end_days, duration_days, 0) || ' days')::INTERVAL)
WHERE (benefit_plan_valid_from IS NULL OR benefit_plan_valid_to IS NULL)
  AND (benefit_plan IS NOT NULL AND benefit_plan != 'free');
