
-- Allow authenticated users to upload their own avatar to university-assets bucket
-- Avatars stored under: avatars/{user_id}/avatar.{ext}

-- Storage policies for university-assets bucket (avatars folder)
INSERT INTO storage.buckets (id, name, public)
VALUES ('university-assets', 'university-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload to their own avatar path
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'university-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'university-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'university-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow public to read all objects in university-assets
CREATE POLICY "Public can read university-assets"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'university-assets');
