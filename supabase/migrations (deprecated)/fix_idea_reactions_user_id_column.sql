/*
  # Fix idea_reactions user_id Column
  
  ## Problem
  - The user_id column is missing from idea_reactions table
  - This breaks the reaction functionality
  
  ## Solution
  - Add user_id column if it doesn't exist
  - Set up proper foreign key to profiles
  - Backfill created_by_auth_uid to user_id mapping if possible
*/

-- Step 1: Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'idea_reactions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE idea_reactions 
      ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 2: Try to backfill user_id from created_by_auth_uid if possible
-- This maps auth UID to profile ID for existing records
UPDATE idea_reactions ir
SET user_id = p.id
FROM profiles p
WHERE ir.created_by_auth_uid = p.user_id
  AND ir.user_id IS NULL
  AND ir.created_by_auth_uid IS NOT NULL;

-- Step 3: Ensure the unique constraint exists for authenticated users
-- This prevents duplicate votes from the same user on the same project
DROP INDEX IF EXISTS idx_idea_reactions_project_user_unique;
CREATE UNIQUE INDEX idx_idea_reactions_project_user_unique
  ON idea_reactions(project_id, user_id)
  WHERE user_id IS NOT NULL;

-- Step 4: Recreate the index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_idea_reactions_user_id 
  ON idea_reactions(user_id)
  WHERE user_id IS NOT NULL;

-- Step 5: Verify the session_id column exists (for anonymous users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'idea_reactions' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE idea_reactions 
      ADD COLUMN session_id text;
  END IF;
END $$;

-- Step 6: Ensure unique constraint for anonymous sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_idea_reactions_project_session_unique
  ON idea_reactions(project_id, session_id)
  WHERE user_id IS NULL AND session_id IS NOT NULL;