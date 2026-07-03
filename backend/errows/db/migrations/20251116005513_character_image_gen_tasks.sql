
CREATE TABLE characters_image_gen_tasks (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cid                     UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  uid                     UUID NOT NULL,
  setting                 JSONB NOT NULL,
  status                  VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)