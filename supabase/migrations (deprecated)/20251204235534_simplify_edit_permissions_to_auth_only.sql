/*
  # Simplify Edit Permissions to Authenticated Users Only

  ## Overview
  Replaces complex session-based editing with simple authentication-based permissions.
  Logged-in users can edit their content regardless of anonymity status.
  Non-logged-in users can submit but cannot edit/delete.

  ## Changes

  ### 1. Schema Updates
  - Add `created_by_auth_uid` to `reviews` table (references auth.users.id)
  - Add `created_by_auth_uid` to `quick_feedback` table (references auth.users.id)
  - Add `created_by_auth_uid` to `idea_reactions` table (references auth.users.id)

  ### 2. Data Backfill
  - Populate `created_by_auth_uid` for existing records where `user_id` exists
  - Anonymous records without user_id will have NULL `created_by_auth_uid` (cannot be edited)

  ### 3. RLS Policy Updates
  - Replace session_id-based policies with simple auth.uid() checks
  - UPDATE policies: Check `auth.uid() = created_by_auth_uid`
  - DELETE policies: Check `auth.uid() = created_by_auth_uid`

  ## Security
  - Only authenticated users can edit/delete their content
  - Anonymous (not logged in) submissions are immutable after creation
  - Logged-in users can still post anonymously but retain edit capability

  ## Benefits
  - Eliminates complex session header validation
  - Uses Supabase's native authentication system
  - Simpler, more secure, easier to debug
  - Better UX for logged-in users
*/

-- Add created_by_auth_uid column to reviews table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'created_by_auth_uid'
  ) THEN
    ALTER TABLE reviews ADD COLUMN created_by_auth_uid uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add created_by_auth_uid column to quick_feedback table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quick_feedback' AND column_name = 'created_by_auth_uid'
  ) THEN
    ALTER TABLE quick_feedback ADD COLUMN created_by_auth_uid uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add created_by_auth_uid column to idea_reactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'idea_reactions' AND column_name = 'created_by_auth_uid'
  ) THEN
    ALTER TABLE idea_reactions ADD COLUMN created_by_auth_uid uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Backfill created_by_auth_uid for reviews where user_id exists
UPDATE reviews r
SET created_by_auth_uid = p.user_id
FROM profiles p
WHERE r.user_id = p.id
AND r.created_by_auth_uid IS NULL
AND p.user_id IS NOT NULL;

-- Backfill created_by_auth_uid for quick_feedback where user_id exists
UPDATE quick_feedback qf
SET created_by_auth_uid = p.user_id
FROM profiles p
WHERE qf.user_id = p.id
AND qf.created_by_auth_uid IS NULL
AND p.user_id IS NOT NULL;

-- Backfill created_by_auth_uid for idea_reactions where user_id exists
UPDATE idea_reactions ir
SET created_by_auth_uid = p.user_id
FROM profiles p
WHERE ir.user_id = p.id
AND ir.created_by_auth_uid IS NULL
AND p.user_id IS NOT NULL;

-- Drop old session-based policies for reviews
DROP POLICY IF EXISTS "Users can update own reviews via user_id or session_id" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews via user_id or session_id" ON reviews;

-- Create new simple auth-based policies for reviews
CREATE POLICY "Authenticated users can update own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by_auth_uid);

CREATE POLICY "Authenticated users can delete own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by_auth_uid);

-- Drop old session-based policies for quick_feedback
DROP POLICY IF EXISTS "Users can update own feedback via user_id or session_id" ON quick_feedback;
DROP POLICY IF EXISTS "Users can delete own feedback via user_id or session_id" ON quick_feedback;

-- Create new simple auth-based policies for quick_feedback
CREATE POLICY "Authenticated users can update own feedback"
  ON quick_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by_auth_uid);

CREATE POLICY "Authenticated users can delete own feedback"
  ON quick_feedback
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by_auth_uid);

-- Drop old policies for idea_reactions if they exist
DROP POLICY IF EXISTS "Authenticated or anonymous users can delete own reactions" ON idea_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON idea_reactions;

-- Create new simple auth-based policies for idea_reactions
CREATE POLICY "Authenticated users can update own reactions"
  ON idea_reactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by_auth_uid);

CREATE POLICY "Authenticated users can delete own reactions"
  ON idea_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by_auth_uid);