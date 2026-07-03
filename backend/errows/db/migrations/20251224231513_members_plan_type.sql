ALTER TABLE members_plan
  ADD COLUMN plan_type VARCHAR(50) NOT NULL,
  ADD COLUMN credential_id UUID NOT NULL;