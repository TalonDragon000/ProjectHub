/*
  # Fix Review Submission - Add Anonymous Review Policy

  ## Overview
  This migration fixes the review submission feature by adding support for anonymous reviews.
  Currently, only authenticated users can submit reviews, but the form doesn't send user_id,
  causing all submissions to fail silently.

  ## Changes Made

  1. RLS Policy Addition
    - Add policy to allow anonymous (anon role) users to submit reviews with NULL user_id
    - Existing authenticated user policy remains unchanged
    
  2. Security Notes
    - Anonymous reviews must have NULL user_id
    - Authenticated reviews must have valid user_id matching their profile
    - This enables both authenticated and anonymous review flows
*/

-- Add policy to allow anonymous users to submit reviews
CREATE POLICY "Anyone can submit anonymous reviews"
  ON reviews FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
