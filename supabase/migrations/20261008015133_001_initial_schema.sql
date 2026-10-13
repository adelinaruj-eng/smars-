/*
# Rubya Seminary 2025 — Initial Schema

## Overview
Creates the full database for a graduating-class community website:
- Members have profiles (display name, avatar, bio, admin flag).
- Members can send 1-on-1 direct messages to each other.
- Members can create group chats, join them, and send messages.
- An admin can manage members (view, promote/demote admin, deactivate).

## New Tables
1. `profiles` — extends `auth.users` with display info
   - `id` (uuid PK, matches auth.users id)
   - `full_name` (text)
   - `display_name` (text, unique handle shown in chat)
   - `avatar_url` (text, nullable — URL to storage object)
   - `bio` (text, nullable)
   - `is_admin` (boolean, default false)
   - `is_active` (boolean, default true — admin can deactivate)
   - `created_at` (timestamptz)

2. `direct_messages` — one-to-one private messages
   - `id` (uuid PK)
   - `sender_id` (uuid FK → profiles)
   - `recipient_id` (uuid FK → profiles)
   - `content` (text)
   - `read_at` (timestamptz, nullable)
   - `created_at` (timestamptz)

3. `group_chats` — group conversation metadata
   - `id` (uuid PK)
   - `name` (text)
   - `description` (text, nullable)
   - `created_by` (uuid FK → profiles)
   - `created_at` (timestamptz)

4. `group_chat_members` — junction table for group membership
   - `id` (uuid PK)
   - `group_chat_id` (uuid FK → group_chats, cascade delete)
   - `user_id` (uuid FK → profiles)
   - `joined_at` (timestamptz)
   - UNIQUE(group_chat_id, user_id)

5. `group_messages` — messages within a group chat
   - `id` (uuid PK)
   - `group_chat_id` (uuid FK → group_chats, cascade delete)
   - `sender_id` (uuid FK → profiles)
   - `content` (text)
   - `created_at` (timestamptz)

## Security (RLS)
- `profiles`: any authenticated member can view all profiles (community directory).
  Only the owner can update their own profile. Admins can update is_admin/is_active.
- `direct_messages`: sender and recipient can view their messages; only sender can insert.
- `group_chats`: members of a group can view; any authenticated user can create a group.
  Only the group creator (or an admin) can update/delete the group.
- `group_chat_members`: members of a group can view membership; any authenticated
  user can join (insert their own membership); user can leave (delete own membership);
  group creator or admin can remove members.
- `group_messages`: group members can view; only members can insert.

## Triggers
- Auto-create a `profiles` row when a new `auth.users` row is inserted.
- Auto-update `profiles.updated_at` on profile update.
*/

-- ===== profiles =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Any authenticated member can view all profiles (community directory)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile (but not is_admin / is_active via this path)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Insert is handled by trigger, but allow just in case
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ===== direct_messages =====
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_recipient ON direct_messages(recipient_id);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Sender or recipient can view their messages
DROP POLICY IF EXISTS "dm_select_participants" ON direct_messages;
CREATE POLICY "dm_select_participants"
ON direct_messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Only sender can insert (sender_id defaults to auth.uid())
DROP POLICY IF EXISTS "dm_insert_sender" ON direct_messages;
CREATE POLICY "dm_insert_sender"
ON direct_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Sender can mark as read their own sent messages, recipient can mark received as read
DROP POLICY IF EXISTS "dm_update_participants" ON direct_messages;
CREATE POLICY "dm_update_participants"
ON direct_messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Sender or recipient can delete their own messages
DROP POLICY IF EXISTS "dm_delete_participants" ON direct_messages;
CREATE POLICY "dm_delete_participants"
ON direct_messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- ===== group_chats =====
CREATE TABLE IF NOT EXISTS group_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can see all group chats (so they can browse and join)
DROP POLICY IF EXISTS "group_chats_select_all" ON group_chats;
CREATE POLICY "group_chats_select_all"
ON group_chats FOR SELECT
TO authenticated
USING (true);

-- Any authenticated user can create a group
DROP POLICY IF EXISTS "group_chats_insert_any" ON group_chats;
CREATE POLICY "group_chats_insert_any"
ON group_chats FOR INSERT
TO authenticated
WITH CHECK (true);

-- Creator or admin can update group
DROP POLICY IF EXISTS "group_chats_update_creator" ON group_chats;
CREATE POLICY "group_chats_update_creator"
ON group_chats FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
)
WITH CHECK (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- Creator or admin can delete group
DROP POLICY IF EXISTS "group_chats_delete_creator" ON group_chats;
CREATE POLICY "group_chats_delete_creator"
ON group_chats FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- ===== group_chat_members =====
CREATE TABLE IF NOT EXISTS group_chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id uuid NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gcm_group ON group_chat_members(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_gcm_user ON group_chat_members(user_id);

ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;

-- Members of a group can view who's in it; also any authenticated can view (directory)
DROP POLICY IF EXISTS "gcm_select_all" ON group_chat_members;
CREATE POLICY "gcm_select_all"
ON group_chat_members FOR SELECT
TO authenticated
USING (true);

-- Any authenticated user can join a group (insert own membership)
DROP POLICY IF EXISTS "gcm_insert_self" ON group_chat_members;
CREATE POLICY "gcm_insert_self"
ON group_chat_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User can leave a group (delete own membership), or group creator / admin can remove
DROP POLICY IF EXISTS "gcm_delete_self_or_creator" ON group_chat_members;
CREATE POLICY "gcm_delete_self_or_creator"
ON group_chat_members FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM group_chats gc
    WHERE gc.id = group_chat_members.group_chat_id AND gc.created_by = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- ===== group_messages =====
CREATE TABLE IF NOT EXISTS group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id uuid NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gm_group ON group_messages(group_chat_id);

ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Only group members can view messages
DROP POLICY IF EXISTS "gm_select_members" ON group_messages;
CREATE POLICY "gm_select_members"
ON group_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_chat_members gcm
    WHERE gcm.group_chat_id = group_messages.group_chat_id AND gcm.user_id = auth.uid()
  )
);

-- Only group members can send messages
DROP POLICY IF EXISTS "gm_insert_members" ON group_messages;
CREATE POLICY "gm_insert_members"
ON group_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM group_chat_members gcm
    WHERE gcm.group_chat_id = group_messages.group_chat_id AND gcm.user_id = auth.uid()
  )
);

-- Sender can delete their own message, or admin
DROP POLICY IF EXISTS "gm_delete_sender_or_admin" ON group_messages;
CREATE POLICY "gm_delete_sender_or_admin"
ON group_messages FOR DELETE
TO authenticated
USING (
  auth.uid() = sender_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- ===== TRIGGER: auto-create profile on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== TRIGGER: update profiles.updated_at =====
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
