/*
# Default "Smars" Group for All Members

## Purpose
Replace the multi-group system with a single default group called "Smars" 
that every member of the community is automatically a member of.

## Changes
1. Inserts a single "Smars" group chat into `group_chats` (idempotent — only if it doesn't exist).
2. Auto-joins all existing active profiles into the Smars group.
3. Creates a trigger function `auto_join_smars_group()` that fires on new profile insert 
   and automatically adds the new user to the Smars group.
4. Creates trigger `on_profile_created_join_smars` on `profiles` table.
5. Revokes INSERT/DELETE permissions on `group_chats` from authenticated users so 
   only the system can create/delete groups (the single Smars group is permanent).

## Security
- The trigger function runs as SECURITY DEFINER (owner) so it can insert into 
  group_chat_members regardless of the caller's role.
- Existing group_chat_members RLS policies remain unchanged — members can still 
  read/insert/delete their own memberships, but the trigger handles auto-join.
- group_chats: authenticated users retain SELECT (to see the group) but lose 
  INSERT and DELETE (can't create or remove the default group).
*/

-- 1. Insert the Smars default group if it doesn't exist
INSERT INTO group_chats (name, description, created_by)
SELECT 'Smars', 'The community group for all Class of 2025 members', id
FROM auth.users
LIMIT 1
ON CONFLICT DO NOTHING;

-- 2. Auto-join all existing profiles into the Smars group
INSERT INTO group_chat_members (group_chat_id, user_id)
SELECT g.id, p.id
FROM group_chats g
CROSS JOIN profiles p
WHERE g.name = 'Smars'
  AND NOT EXISTS (
    SELECT 1 FROM group_chat_members gcm
    WHERE gcm.group_chat_id = g.id AND gcm.user_id = p.id
  )
ON CONFLICT DO NOTHING;

-- 3. Create trigger function to auto-join new users
CREATE OR REPLACE FUNCTION auto_join_smars_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  smars_group_id uuid;
BEGIN
  SELECT id INTO smars_group_id FROM group_chats WHERE name = 'Smars' LIMIT 1;
  IF smars_group_id IS NOT NULL THEN
    INSERT INTO group_chat_members (group_chat_id, user_id)
    VALUES (smars_group_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create the trigger (drop first for idempotency)
DROP TRIGGER IF EXISTS on_profile_created_join_smars ON profiles;
CREATE TRIGGER on_profile_created_join_smars
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_join_smars_group();

-- 5. Revoke INSERT and DELETE on group_chats from authenticated and anon
--    so only the system (SECURITY DEFINER functions, service role) can manage groups
REVOKE INSERT ON group_chats FROM authenticated, anon;
REVOKE DELETE ON group_chats FROM authenticated, anon;

-- Grant EXECUTE on the trigger function to authenticated (needed for trigger context)
GRANT EXECUTE ON FUNCTION auto_join_smars_group() TO authenticated;
