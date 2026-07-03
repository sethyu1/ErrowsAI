ALTER TABLE characters_video_gen_tasks
    DROP CONSTRAINT characters_video_gen_tasks_id_fkey;

ALTER TABLE characters_video_gen_tasks
    ADD COLUMN image_id UUID REFERENCES characters_images(id) ON DELETE CASCADE;

UPDATE characters_video_gen_tasks t SET image_id = id;

ALTER TABLE characters_video_gen_tasks
    ALTER COLUMN image_id SET NOT NULL;

ALTER TABLE characters_video_gen_tasks
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE characters_videos
    ADD COLUMN image_id UUID REFERENCES characters_images(id) ON DELETE CASCADE;

UPDATE characters_videos SET image_id = id;

ALTER TABLE characters_videos
    ALTER COLUMN image_id SET NOT NULL;