/*
# Statuses, Status Views, and Class Photos

## Overview
Adds WhatsApp-like features:
1. Statuses — members can post text or photo statuses that last 24 hours.
2. Class Photos (Memories) — members upload class photos to a shared gallery.
   Admins approve or reject to ensure they are class-related.
3. Class Photo Likes — members can like photos in the gallery.

## New Tables
1. `statuses` — text or photo status posts (24h ephemeral)
2. `status_views` — tracks who viewed each status
3. `class_photos` — uploaded memory photos with approval workflow
4. `class_photo_likes` — likes on class photos

## Security
- Statuses: all authenticated can view; only owner can insert/delete.
- Status views: all authenticated can view; only viewer can insert own.
- Class photos: approved photos visible to all; own photos visible to uploader;
  admin sees all; any authenticated can upload; admin can update status;
  owner or admin can delete.
- Class photo likes: all can view; only owner can insert/delete own.
- SECURITY DEFINER functions for admin approve/reject.
- Storage bucket `class-photos` (public read, authenticated upload).
*/

-- ===== statuses =====
CREATE TABLE IF NOT EXISTS statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'photo')),
  background_color text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_statuses_user ON statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_statuses_created ON statuses(created_at);

ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "statuses_select_all" ON statuses;
CREATE POLICY "statuses_select_all"
ON statuses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "statuses_insert_own" ON statuses;
CREATE POLICY "statuses_insert_own"
ON statuses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "statuses_delete_own" ON statuses;
CREATE POLICY "statuses_delete_own"
ON statuses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== status_views =====
CREATE TABLE IF NOT EXISTS status_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_id uuid NOT NULL REFERENCES statuses(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(status_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_sv_status ON status_views(status_id);

ALTER TABLE status_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sv_select_all" ON status_views;
CREATE POLICY "sv_select_all"
ON status_views FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "sv_insert_own" ON status_views;
CREATE POLICY "sv_insert_own"
ON status_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);

-- ===== class_photos =====
CREATE TABLE IF NOT EXISTS class_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cp_status ON class_photos(status);
CREATE INDEX IF NOT EXISTS idx_cp_uploaded_by ON class_photos(uploaded_by);

ALTER TABLE class_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cp_select_visible" ON class_photos;
CREATE POLICY "cp_select_visible"
ON class_photos FOR SELECT TO authenticated
USING (
  status = 'approved'
  OR uploaded_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

DROP POLICY IF EXISTS "cp_insert_any" ON class_photos;
CREATE POLICY "cp_insert_any"
ON class_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "cp_update_admin_or_owner" ON class_photos;
CREATE POLICY "cp_update_admin_or_owner"
ON class_photos FOR UPDATE TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
)
WITH CHECK (
  uploaded_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

DROP POLICY IF EXISTS "cp_delete_owner_or_admin" ON class_photos;
CREATE POLICY "cp_delete_owner_or_admin"
ON class_photos FOR DELETE TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- ===== class_photo_likes =====
CREATE TABLE IF NOT EXISTS class_photo_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES class_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cpl_photo ON class_photo_likes(photo_id);

ALTER TABLE class_photo_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cpl_select_all" ON class_photo_likes;
CREATE POLICY "cpl_select_all"
ON class_photo_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cpl_insert_own" ON class_photo_likes;
CREATE POLICY "cpl_insert_own"
ON class_photo_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cpl_delete_own" ON class_photo_likes;
CREATE POLICY "cpl_delete_own"
ON class_photo_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== Admin review functions =====
CREATE OR REPLACE FUNCTION public.approve_class_photo(p_photo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  SELECT is_admin INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  IF caller_is_admin IS NULL OR caller_is_admin = false THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;
  UPDATE public.class_photos
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_photo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_class_photo(p_photo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  SELECT is_admin INTO caller_is_admin FROM public.profiles WHERE id = auth.uid();
  IF caller_is_admin IS NULL OR caller_is_admin = false THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;
  UPDATE public.class_photos
  SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_photo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_class_photo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_class_photo(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_class_photo(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reject_class_photo(uuid) FROM anon, public;

-- ===== class-photos storage bucket =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('class-photos', 'class-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "class_photos_read_all" ON storage.objects;
CREATE POLICY "class_photos_read_all"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'class-photos');

DROP POLICY IF EXISTS "class_photos_upload_auth" ON storage.objects;
CREATE POLICY "class_photos_upload_auth"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'class-photos');

DROP POLICY IF EXISTS "class_photos_delete_own_or_admin" ON storage.objects;
CREATE POLICY "class_photos_delete_own_or_admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'class-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
);
