/*
  # Allow Anonymous Users to Delete Their Reactions

  ## Overview
  Adds RLS policy to allow anonymous users to delete their own reactions
  based on session_id. This enables vote removal and vote changes.

  ## Changes

  ### 1. New Policy
  - Add DELETE policy for anonymous users using session_id

  ## Notes
  - Anonymous users can only delete reactions with their session_id
  - Enables full vote management (add, change, remove) for anonymous users
*/

-- ============================================================================
-- ADD DELETE POLICY FOR ANONYMOUS USERS
-- ============================================================================

CREATE POLICY "Anonymous users can delete own reactions"
  ON idea_reactions
  FOR DELETE
  TO anon
  USING (user_id IS NULL AND session_id IS NOT NULL);