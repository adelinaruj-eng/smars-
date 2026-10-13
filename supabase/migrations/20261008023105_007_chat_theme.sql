/*
# Add chat_theme column to profiles

## Overview
Adds a `chat_theme` column to the `profiles` table so each member can
pick a background theme for their chat display area. The default theme
is 'mountain' (the first option in the theme picker).

## Modified Tables
- `profiles`
  - `chat_theme` (text, default 'mountain') — stores the theme key

## Security
- No policy changes needed. The existing `profiles_update_own` policy
  already allows users to update their own profile row, and chat_theme
  is a non-privileged column.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chat_theme text NOT NULL DEFAULT 'mountain';
