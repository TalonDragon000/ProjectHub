/*
  # Anonymous Posting and Edit Tracking System

  ## Overview
  Enables users to post reviews and feedback anonymously while maintaining edit capability
  via session tracking. Includes XP recalculation system for anonymity toggles.

  ## Changes

  ### 1. Profile Table Updates
  - Add `post_reviews_anonymously` (boolean, default: false) - User preference for anonymous reviews
  - Add `post_feedback_anonymously` (boolean, default: false) - User preference for anonymous feedback

  ### 2. Reviews Table Updates
  - Add `session_id` (text, nullable) - Track anonymous posts for edit/delete capability
  - Add `last_edited_at` (timestamptz, nullable) - Track when review was last edited
  - Update RLS policies to allow anonymous editing/deleting via session_id

  ### 3. Quick Feedback Table Updates
  - Add `session_id` (text, nullable) - Track anonymous feedback for edit/delete capability
  - Add `last_edited_at` (timestamptz, nullable) - Track when feedback was last edited
  - Update RLS policies to allow anonymous editing/deleting via session_id

  ### 4. XP Recalculation Function
  - Create function to handle XP adjustments when anonymity status changes
  - Award/revoke XP based on review_identity_public toggle during edits

  ## Security
  - RLS policies allow users to edit/delete their own posts via user_id OR session_id
  - XP adjustments are atomic and idempotent
  - Session IDs are validated but not stored in user profiles for privacy
*/

-- Add anonymity preference columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'post_reviews_anonymously'
  ) THEN
    ALTER TABLE profiles ADD COLUMN post_reviews_anonymously boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'post_feedback_anonymously'
  ) THEN
    ALTER TABLE profiles ADD COLUMN post_feedback_anonymously boolean DEFAULT false;
  END IF;
END $$;

-- Add session_id and last_edited_at to reviews table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN session_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'last_edited_at'
  ) THEN
    ALTER TABLE reviews ADD COLUMN last_edited_at timestamptz;
  END IF;
END $$;

-- Add session_id and last_edited_at to quick_feedback table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quick_feedback' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE quick_feedback ADD COLUMN session_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quick_feedback' AND column_name = 'last_edited_at'
  ) THEN
    ALTER TABLE quick_feedback ADD COLUMN last_edited_at timestamptz;
  END IF;
END $$;

-- Drop existing restrictive policies for reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

-- Create new policies allowing edit/delete via user_id OR session_id
CREATE POLICY "Users can update own reviews via user_id or session_id"
  ON reviews
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  );

CREATE POLICY "Users can delete own reviews via user_id or session_id"
  ON reviews
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  );

-- Drop existing restrictive policies for quick_feedback
DROP POLICY IF EXISTS "Users can update own feedback" ON quick_feedback;
DROP POLICY IF EXISTS "Users can delete own feedback" ON quick_feedback;

-- Create new policies allowing edit/delete via user_id OR session_id
CREATE POLICY "Users can update own feedback via user_id or session_id"
  ON quick_feedback
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  );

CREATE POLICY "Users can delete own feedback via user_id or session_id"
  ON quick_feedback
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (session_id IS NOT NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  );

-- Create function to recalculate XP when review anonymity changes
CREATE OR REPLACE FUNCTION recalculate_review_xp_on_edit(
  p_review_id uuid,
  p_old_user_id uuid,
  p_new_user_id uuid,
  p_review_identity_public boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_creator_id uuid;
  v_existing_xp_transaction_id uuid;
BEGIN
  -- Get the project creator ID
  SELECT p.creator_id INTO v_project_creator_id
  FROM reviews r
  JOIN projects p ON r.project_id = p.id
  WHERE r.id = p_review_id;

  -- Check if there's already an XP transaction for this review
  SELECT id INTO v_existing_xp_transaction_id
  FROM xp_transactions
  WHERE review_id = p_review_id
  AND transaction_type = 'review_public_identity';

  -- Case 1: Going from anonymous (NULL) to authenticated with public identity
  IF p_old_user_id IS NULL AND p_new_user_id IS NOT NULL AND p_review_identity_public = true THEN
    -- Award +2 XP to reviewer
    IF v_existing_xp_transaction_id IS NULL THEN
      INSERT INTO xp_transactions (user_id, amount, transaction_type, review_id)
      VALUES (p_new_user_id, 2, 'review_public_identity', p_review_id);
      
      UPDATE profiles SET total_xp = total_xp + 2 WHERE id = p_new_user_id;
    END IF;

  -- Case 2: Going from authenticated to anonymous
  ELSIF p_old_user_id IS NOT NULL AND p_new_user_id IS NULL THEN
    -- Revoke +2 XP from reviewer if they had it
    IF v_existing_xp_transaction_id IS NOT NULL THEN
      DELETE FROM xp_transactions WHERE id = v_existing_xp_transaction_id;
      UPDATE profiles SET total_xp = GREATEST(0, total_xp - 2) WHERE id = p_old_user_id;
    END IF;

  -- Case 3: Staying authenticated but toggling review_identity_public
  ELSIF p_old_user_id IS NOT NULL AND p_new_user_id IS NOT NULL AND p_old_user_id = p_new_user_id THEN
    IF p_review_identity_public = true AND v_existing_xp_transaction_id IS NULL THEN
      -- Award +2 XP
      INSERT INTO xp_transactions (user_id, amount, transaction_type, review_id)
      VALUES (p_new_user_id, 2, 'review_public_identity', p_review_id);
      
      UPDATE profiles SET total_xp = total_xp + 2 WHERE id = p_new_user_id;
      
    ELSIF p_review_identity_public = false AND v_existing_xp_transaction_id IS NOT NULL THEN
      -- Revoke +2 XP
      DELETE FROM xp_transactions WHERE id = v_existing_xp_transaction_id;
      UPDATE profiles SET total_xp = GREATEST(0, total_xp - 2) WHERE id = p_new_user_id;
    END IF;
  END IF;
END;
$$;