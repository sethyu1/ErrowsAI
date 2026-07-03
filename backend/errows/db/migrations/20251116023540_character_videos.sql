CREATE TABLE characters_video_gen_tasks (
  id                    UUID REFERENCES characters_images(id) ON DELETE CASCADE PRIMARY KEY,
  cid                   UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  uid                   UUID NOT NULL,
  status                VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE characters_videos (
  id                UUID REFERENCES characters_video_gen_tasks(id) PRIMARY KEY NOT NULL,
  cid               UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  uid               UUID NOT NULL,
  url               TEXT NOT NULL,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);