/*
  # Fix quick_feedback Foreign Key with Data Migration
  
  ## Problem
  - quick_feedback.user_id currently contains auth.users.id values
  - We need it to contain profiles.id values instead
  
  ## Solution
  1. DROP the old foreign key constraint FIRST
  2. Update existing user_id values to map from auth.users.id to profiles.id
  3. Add new foreign key referencing profiles(id)
*/

-- Step 1: Drop the old foreign key constraint FIRST (before updating data)
ALTER TABLE quick_feedback 
  DROP CONSTRAINT IF EXISTS quick_feedback_user_id_fkey;

-- Step 2: Update existing user_id values from auth.users.id to profiles.id
-- This maps the auth UID to the corresponding profile ID
UPDATE quick_feedback
SET user_id = p.id
FROM profiles p
WHERE quick_feedback.user_id = p.user_id
  AND quick_feedback.user_id IS NOT NULL;

-- Step 3: Set user_id to NULL for any records that don't have a matching profile
-- (This handles edge cases where auth user exists but profile doesn't)
UPDATE quick_feedback
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = quick_feedback.user_id
  );

-- Step 4: Add new foreign key referencing profiles(id)
ALTER TABLE quick_feedback 
  ADD CONSTRAINT quick_feedback_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE SET NULL;

-- Step 5: Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_quick_feedback_user_id 
  ON quick_feedback(user_id) 
  WHERE user_id IS NOT NULL;