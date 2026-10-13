/*
# Avatar Storage Bucket

## Overview
Creates a public storage bucket `avatars` for member display photos.
Each user stores their avatar at `avatars/{user_id}/avatar.jpg`.

## Security
- Anyone can read avatars (public bucket — avatars are visible in chat).
- Only the authenticated owner can upload/update their own avatar.
- Only the owner can delete their own avatar.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "avatar_read_all" ON storage.objects;
CREATE POLICY "avatar_read_all"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Owner can upload (path starts with their user id)
DROP POLICY IF EXISTS "avatar_upload_own" ON storage.objects;
CREATE POLICY "avatar_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Owner can update their own avatar
DROP POLICY IF EXISTS "avatar_update_own" ON storage.objects;
CREATE POLICY "avatar_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Owner can delete their own avatar
DROP POLICY IF EXISTS "avatar_delete_own" ON storage.objects;
CREATE POLICY "avatar_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
