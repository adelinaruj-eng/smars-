/*
# Add Video Support to Memories and Status

## What This Migration Does

1. **Memories (class_photos)**: Adds a `media_type` column (text, default 'image')
   so the gallery can distinguish between image and video uploads.
   Values: 'image' or 'video'.

2. **Status (statuses)**: Adds 'video' to the allowed values for the `type` column.
   Previously only 'text' and 'photo' were allowed. Now 'video' is also valid.

## Security
- No RLS policy changes needed — existing policies already cover all columns.
- `media_type` is owner-settable and follows the same RLS as other columns.
*/

-- Add media_type to class_photos
ALTER TABLE class_photos ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

-- Add 'video' to statuses type check constraint
ALTER TABLE statuses DROP CONSTRAINT IF EXISTS statuses_type_check;
ALTER TABLE statuses ADD CONSTRAINT statuses_type_check CHECK (type IN ('text', 'photo', 'video'));
