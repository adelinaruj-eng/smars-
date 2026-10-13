/*
# Online Presence Tracking

## Overview
Creates a `presence` table that tracks which users are currently online.
Each user's client sends a heartbeat (upserts their row with a fresh
`last_seen` timestamp) every 30 seconds. A user is considered "online"
if their `last_seen` is within the last 90 seconds. A background cleanup
function marks old rows as offline.

## New Tables
- `presence`
  - `user_id` (uuid PK, references profiles, cascade delete)
  - `last_seen` (timestamptz, defaults to now())
  - `is_online` (boolean, default true)

## Security
- Any authenticated user can view all presence rows (to see who's online).
- Any authenticated user can upsert their own presence row.
- A SECURITY DEFINER function `cleanup_stale_presence()` marks rows with
  `last_seen` older than 90 seconds as offline. Callable by authenticated users.
*/

CREATE TABLE IF NOT EXISTS presence (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_seen timestamptz NOT NULL DEFAULT now(),
  is_online boolean NOT NULL DEFAULT true
);

ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can see who is online
DROP POLICY IF EXISTS "presence_select_all" ON presence;
CREATE POLICY "presence_select_all"
ON presence FOR SELECT
TO authenticated
USING (true);

-- Users can upsert their own presence (heartbeat)
DROP POLICY IF EXISTS "presence_upsert_own" ON presence;
CREATE POLICY "presence_upsert_own"
ON presence FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "presence_update_own" ON presence;
CREATE POLICY "presence_update_own"
ON presence FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Cleanup function: mark stale rows as offline
CREATE OR REPLACE FUNCTION public.cleanup_stale_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.presence
  SET is_online = false
  WHERE last_seen < now() - interval '90 seconds' AND is_online = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_stale_presence() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_presence() FROM anon, public;
