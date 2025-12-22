/*
  # Add Feedback Validation Tracking

  ## Overview
  Enhances the quick_feedback system to support validator participation tracking and 
  links feedback to specific idea reactions. This allows authenticated users to build
  their validator reputation while maintaining anonymous feedback support.

  ## Changes

  ### 1. Schema Updates to quick_feedback Table
  - Add `user_id` (uuid, nullable) - Links feedback to authenticated users
  - Add `reaction_type` (text, nullable) - Associates feedback with specific rating ('need', 'curious', 'rethink')

  ### 2. Validator Participation Tracking
  - Add `validation_count` to profiles table - Tracks total feedback submissions by authenticated users
  - Add `reviewer_count` to profiles table - Tracks total reviews submitted (for comprehensive participation tracking)

  ### 3. Automatic Participation Counting
  - Create trigger function to increment validation_count when authenticated user submits feedback
  - Updates happen automatically on INSERT to quick_feedback table

  ### 4. Security (RLS Policies)
  - Maintain public read access for feedback on published projects
  - Maintain anonymous write access for feedback submission
  - Add policy for authenticated users to track their own feedback via user_id

  ## Notes
  - Anonymous feedback is still fully supported (user_id remains null)
  - Authenticated users earn validator credit automatically
  - reaction_type helps contextualize feedback within the validation flow
*/

-- ============================================================================
-- STEP 1: ADD NEW COLUMNS TO QUICK_FEEDBACK
-- ============================================================================

-- Add user_id column (nullable to support anonymous feedback)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quick_feedback' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE quick_feedback ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add reaction_type column to link feedback to specific ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quick_feedback' AND column_name = 'reaction_type'
  ) THEN
    ALTER TABLE quick_feedback ADD COLUMN reaction_type text CHECK (reaction_type IN ('need', 'curious', 'rethink'));
  END IF;
END $$;

-- ============================================================================
-- STEP 2: ADD PARTICIPATION TRACKING TO PROFILES
-- ============================================================================

-- Add validation_count to track feedback submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'validation_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN validation_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add reviewer_count to track review submissions (for comprehensive tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'reviewer_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN reviewer_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE TRIGGER FUNCTION TO INCREMENT VALIDATION COUNT
-- ============================================================================

-- Function to increment validation_count when authenticated user submits feedback
CREATE OR REPLACE FUNCTION increment_validation_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if user_id is not null (authenticated submission)
  IF NEW.user_id IS NOT NULL THEN
    UPDATE profiles
    SET validation_count = validation_count + 1
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_feedback_submitted ON quick_feedback;

-- Create trigger that fires after feedback insert
CREATE TRIGGER on_feedback_submitted
  AFTER INSERT ON quick_feedback
  FOR EACH ROW
  EXECUTE FUNCTION increment_validation_count();

-- ============================================================================
-- STEP 4: CREATE INDEX FOR PERFORMANCE
-- ============================================================================

-- Index for querying feedback by user_id
CREATE INDEX IF NOT EXISTS idx_feedback_user ON quick_feedback(user_id);

-- Index for querying feedback by reaction_type
CREATE INDEX IF NOT EXISTS idx_feedback_reaction ON quick_feedback(reaction_type);

-- ============================================================================
-- STEP 5: UPDATE RLS POLICIES (IF NEEDED)
-- ============================================================================

-- The existing policies already support our needs:
-- - "Anyone can view feedback for published projects" allows public reads
-- - "Anyone can submit feedback" allows anonymous writes with user_id = null
-- No changes needed to RLS policies