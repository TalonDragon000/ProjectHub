/*
  # Enable Anonymous Idea Reactions

  ## Overview
  Allows both authenticated and anonymous users to react to project ideas.
  Uses local storage on client side to prevent duplicate anonymous votes.

  ## Changes

  ### 1. Add session tracking column
  - Add `session_id` (text, nullable) to track anonymous user sessions
  - This helps identify anonymous users across page loads using local storage

  ### 2. RLS Policies
  - Add policy for anonymous reactions (write-only, tracked by session_id)

  ### 3. Update unique constraint
  - Keep existing UNIQUE(project_id, user_id) constraint
  - Add partial unique index for anonymous sessions

  ## Notes
  - Anonymous reactions are tracked using session_id stored in browser local storage
  - Authenticated users can change their reaction, anonymous users are prevented by client-side checks
  - The session_id ensures one vote per session per project
*/

-- ============================================================================
-- STEP 1: ADD SESSION_ID COLUMN
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'idea_reactions' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE idea_reactions ADD COLUMN session_id text;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: CREATE UNIQUE INDEX FOR ANONYMOUS SESSIONS
-- ============================================================================

-- Create a partial unique index to prevent duplicate anonymous votes from same session
CREATE UNIQUE INDEX IF NOT EXISTS idx_idea_reactions_project_session_unique
  ON idea_reactions(project_id, session_id)
  WHERE user_id IS NULL AND session_id IS NOT NULL;

-- ============================================================================
-- STEP 3: CREATE RLS POLICY FOR ANONYMOUS USERS
-- ============================================================================

-- Policy: Anonymous users can insert reactions (with session_id)
CREATE POLICY "Anonymous users can insert reactions"
  ON idea_reactions
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- ============================================================================
-- STEP 4: CREATE INDEX FOR SESSION_ID LOOKUPS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_idea_reactions_session_id
  ON idea_reactions(session_id)
  WHERE session_id IS NOT NULL;