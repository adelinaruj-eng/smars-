/*
# E2E Encryption Support + First-Admin Claim + Smars AI Conversations

## What This Migration Does

1. **E2E Encryption for DMs**
   - Adds `public_key` (text, nullable) column to `profiles` so each user can publish an ECDH public key.
   - Adds `iv` (text, nullable) column to `direct_messages` to store the AES-GCM initialization vector alongside the encrypted `content`.
   - Existing messages remain readable (plaintext) — the app handles both encrypted and plaintext messages.

2. **First-Admin Claim**
   - Adds a SECURITY DEFINER function `claim_first_admin()` that grants admin to the *first* user to call it, but only if no admin currently exists in the database.
   - This lets the first person who signs in claim admin privileges through a portal button.
   - Uses `SECURITY DEFINER` because the `is_admin` column is not writable by users via RLS.

3. **Smars AI Conversations Table**
   - Creates `ai_conversations` table to store chat history with Smars AI.
   - Each row has: id, user_id, role ('user' | 'assistant'), content, created_at.
   - RLS: users can only CRUD their own conversations.

## Security Changes
- `claim_first_admin` is SECURITY DEFINER, callable by authenticated only, and checks that no admin exists before granting.
- `ai_conversations` has RLS with owner-scoped policies using `auth.uid()`.
- `profiles.public_key` is readable by all authenticated users (needed to encrypt messages TO them) but only writable by the owner.
- `direct_messages.iv` follows the same RLS as the rest of the table (no policy changes needed — existing policies already cover all columns).
*/

-- ============ E2E Encryption: profiles.public_key ============
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_key text;

-- ============ E2E Encryption: direct_messages.iv ============
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS iv text;

-- ============ First-Admin Claim ============
CREATE OR REPLACE FUNCTION claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT count(*) INTO admin_count FROM profiles WHERE is_admin = true;
  IF admin_count > 0 THEN
    RETURN false;
  END IF;
  UPDATE profiles SET is_admin = true, updated_at = now() WHERE id = auth.uid();
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_first_admin() TO authenticated;

-- ============ Smars AI Conversations Table ============
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_conversations" ON ai_conversations;
CREATE POLICY "select_own_ai_conversations"
  ON ai_conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_conversations" ON ai_conversations;
CREATE POLICY "insert_own_ai_conversations"
  ON ai_conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ai_conversations" ON ai_conversations;
CREATE POLICY "delete_own_ai_conversations"
  ON ai_conversations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
