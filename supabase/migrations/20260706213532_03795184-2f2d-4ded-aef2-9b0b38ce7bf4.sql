
-- Allow demo/curated artist profiles that aren't tied to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Seed 7 demo artist profiles + 10 tracks (idempotent)
INSERT INTO public.profiles (id, display_name, is_artist, is_verified, location, genres, monthly_listeners)
VALUES
  ('11111111-1111-1111-1111-000000000001','Freeman HKD', true, true, 'Harare, Zimbabwe', ARRAY['Zimdancehall','Afro-Pop'], 2100000),
  ('11111111-1111-1111-1111-000000000002','Voltz JT',    true, true, 'Harare, Zimbabwe', ARRAY['Hip-Hop','Zimdancehall'], 1700000),
  ('11111111-1111-1111-1111-000000000003','Takura',      true, true, 'Harare, Zimbabwe', ARRAY['Afro-Pop','Hip-Hop'], 1100000),
  ('11111111-1111-1111-1111-000000000004','Saint Floew', true, true, 'Harare, Zimbabwe', ARRAY['Hip-Hop'], 1300000),
  ('11111111-1111-1111-1111-000000000005','Mbeu',        true, true, 'Harare, Zimbabwe', ARRAY['Afro-Pop','Gospel'], 962000),
  ('11111111-1111-1111-1111-000000000006','Asaph',       true, true, 'Bulawayo, Zimbabwe', ARRAY['Hip-Hop'], 1700000),
  ('11111111-1111-1111-1111-000000000007','Various Artists', true, false, 'Zimbabwe', ARRAY['Amapiano'], 678000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tracks (id, artist_id, artist_name, title, cover_url, audio_url, duration_seconds, genre, play_count, is_trending, is_published)
VALUES
  ('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-000000000001','Freeman HKD','MaFeelings','https://picsum.photos/seed/mafeelings/400','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',227,'Zimdancehall',2100000,true,true),
  ('22222222-0000-0000-0000-000000000002','11111111-1111-1111-1111-000000000002','Voltz JT','Pakati','https://picsum.photos/seed/pakati/400','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',214,'Hip-Hop',1700000,true,true),
  ('22222222-0000-0000-0000-000000000003','11111111-1111-1111-1111-000000000003','Takura','Ndakakunda','https://picsum.photos/seed/ndakakunda/400','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',246,'Afro-Pop',1100000,true,true),
  ('22222222-0000-0000-0000-000000000004','11111111-1111-1111-1111-000000000004','Saint Floew','MaStreets','https://picsum.photos/seed/mastreets/400','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',227,'Hip-Hop',1300000,false,true),
  ('22222222-0000-0000-0000-000000000005','11111111-1111-1111-1111-000000000005','Mbeu','Zvese','https://picsum.photos/seed/zvese/400','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',179,'Afro-Pop',962000,false,true),
  ('22222222-0000-0000-0000-000000000006','11111111-1111-1111-1111-000000000006','Asaph','Haina Kurema','https://picsum.photos/seed/hainakurema/400','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',192,'Hip-Hop',1700000,false,true),
  ('22222222-0000-0000-0000-000000000007','11111111-1111-1111-1111-000000000005','Mbeu','Rudo Rwako','https://picsum.photos/seed/rudorwako/400','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',205,'Gospel',512000,false,true),
  ('22222222-0000-0000-0000-000000000008','11111111-1111-1111-1111-000000000004','Saint Floew','Tingaziva','https://picsum.photos/seed/tingaziva/400','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',233,'Hip-Hop',823000,false,true),
  ('22222222-0000-0000-0000-000000000009','11111111-1111-1111-1111-000000000003','Takura','Energy','https://picsum.photos/seed/energy/400','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',198,'Afro-Pop',1400000,false,true),
  ('22222222-0000-0000-0000-000000000010','11111111-1111-1111-1111-000000000007','Various Artists','Kubatana','https://picsum.photos/seed/kubatana/400','https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',221,'Amapiano',678000,false,true)
ON CONFLICT (id) DO NOTHING;

-- Helpful index for recommendations
CREATE INDEX IF NOT EXISTS idx_likes_user ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_plays_user ON public.plays(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON public.tracks(genre) WHERE is_published;
