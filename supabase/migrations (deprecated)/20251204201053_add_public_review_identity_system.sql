/*
  # Add Public Review Identity System

  1. Profile Updates
    - Add `review_identity_public` column to profiles (default: false)
    - Users can opt-in to show their identity on reviews
    - Earns +2 XP bonus per review when identity is public

  2. Changes Summary
    - Profiles table: New boolean column for identity disclosure preference
    - Index for performance on public review queries
    
  3. Security
    - All profiles can read the review_identity_public flag
    - Only the profile owner can update their own flag
    
  4. Important Notes
    - Anonymous reviews (user_id = NULL) award no XP
    - Private reviews (user_id set, review_identity_public = false) award 5 XP to project owner only
    - Public reviews (user_id set, review_identity_public = true) award 5 XP to project owner + 2 XP bonus to reviewer
*/

-- ============================================================================
-- STEP 1: ADD REVIEW_IDENTITY_PUBLIC TO PROFILES
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'review_identity_public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN review_identity_public boolean DEFAULT false;
  END IF;
END $$;

-- Index for performance when querying public reviewers
CREATE INDEX IF NOT EXISTS idx_profiles_review_identity_public 
ON profiles(review_identity_public) 
WHERE review_identity_public = true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.review_identity_public IS 'When true, user identity is shown publicly on reviews and earns +2 XP bonus per review';
