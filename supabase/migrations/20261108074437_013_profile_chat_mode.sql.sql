/*
# Add chat appearance mode to profiles

1. Modified Tables
- `profiles`: new column `chat_mode` (text, not null, default 'light', allowed values 'light' or 'dark').

2. Purpose
- Lets each member choose whether their chat screens use the light or dark look from their personal settings.

3. Security
- No policy or grant changes. The existing profile update access already covers the new column, and the value is restricted to the two allowed options by a check constraint.

4. Notes
- Existing profiles receive 'light' automatically, so nothing changes for members until they pick dark mode.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chat_mode text NOT NULL DEFAULT 'light' CHECK (chat_mode IN ('light', 'dark'));
