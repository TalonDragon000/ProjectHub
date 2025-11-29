/*
  # Add Project Ideas System

  ## Overview
  This migration adds the "Idea" feature to projects, allowing creators to document
  the initial concept, problem area, and keywords. Users can react with hot/cold
  sentiment to ideas, and collaboration status is tracked.

  ## Changes Made

  1. New Tables
    - `project_ideas`: Stores idea data for each project (1-to-1 relationship)
      - `id` (uuid, primary key)
      - `project_id` (uuid, unique, references projects)
      - `problem_area` (text, what problem does this solve)
      - `keywords` (text array, keyword tags)
      - `hot_count` (integer, count of hot reactions)
      - `cold_count` (integer, count of cold reactions)
      - `collaboration_open` (boolean, open to collaborators)
      - `created_at`, `updated_at` (timestamps)
    
    - `idea_reactions`: Tracks user reactions to ideas (hot/cold)
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `user_id` (uuid, references profiles, nullable for anonymous)
      - `reaction_type` ('hot' or 'cold')
      - `created_at` (timestamp)
      - Unique constraint on (project_id, user_id)

  2. Profile Enhancement
    - Add `is_idea_maker` boolean flag to profiles
    - Auto-set when user creates first project idea

  3. Security
    - Enable RLS on both new tables
    - Public can view published project ideas
    - Only project owners can create/update ideas
    - Anyone can react (authenticated users tracked, anonymous allowed)
    - Reactions are viewable by everyone

  4. Triggers & Functions
    - Auto-update hot/cold counts when reactions change
    - Auto-set is_idea_maker flag on profile
    - Update timestamps on changes
*/

-- ============================================================================
-- STEP 1: CREATE PROJECT_IDEAS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  problem_area text NOT NULL,
  keywords text[] DEFAULT '{}',
  hot_count integer DEFAULT 0,
  cold_count integer DEFAULT 0,
  collaboration_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_ideas ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_ideas_project_id ON project_ideas(project_id);
CREATE INDEX IF NOT EXISTS idx_project_ideas_hot_count ON project_ideas(hot_count DESC);
CREATE INDEX IF NOT EXISTS idx_project_ideas_keywords ON project_ideas USING GIN(keywords);

-- ============================================================================
-- STEP 2: CREATE IDEA_REACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS idea_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('hot', 'cold')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE idea_reactions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_idea_reactions_project_id ON idea_reactions(project_id);
CREATE INDEX IF NOT EXISTS idx_idea_reactions_user_id ON idea_reactions(user_id);

-- ============================================================================
-- STEP 3: UPDATE PROFILES TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_idea_maker'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_idea_maker boolean DEFAULT false;
  END IF;
END $$;

-- Index for idea makers
CREATE INDEX IF NOT EXISTS idx_profiles_is_idea_maker ON profiles(is_idea_maker) WHERE is_idea_maker = true;

-- ============================================================================
-- STEP 4: RLS POLICIES FOR PROJECT_IDEAS
-- ============================================================================

-- Anyone can view ideas for published projects
CREATE POLICY "Ideas viewable for published projects"
  ON project_ideas FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_ideas.project_id 
      AND projects.is_published = true
    )
  );

-- Project owners can view their own project ideas (even unpublished)
CREATE POLICY "Owners can view own project ideas"
  ON project_ideas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = p.user_id
      WHERE p.id = project_ideas.project_id
      AND pr.user_id = auth.uid()
    )
  );

-- Project owners can insert ideas for their projects
CREATE POLICY "Owners can insert project ideas"
  ON project_ideas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = p.user_id
      WHERE p.id = project_ideas.project_id
      AND pr.user_id = auth.uid()
    )
  );

-- Project owners can update their project ideas
CREATE POLICY "Owners can update project ideas"
  ON project_ideas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = p.user_id
      WHERE p.id = project_ideas.project_id
      AND pr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = p.user_id
      WHERE p.id = project_ideas.project_id
      AND pr.user_id = auth.uid()
    )
  );

-- Project owners can delete their project ideas
CREATE POLICY "Owners can delete project ideas"
  ON project_ideas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = p.user_id
      WHERE p.id = project_ideas.project_id
      AND pr.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 5: RLS POLICIES FOR IDEA_REACTIONS
-- ============================================================================

-- Anyone can view reactions
CREATE POLICY "Reactions are viewable by everyone"
  ON idea_reactions FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert reactions
CREATE POLICY "Authenticated users can react"
  ON idea_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions"
  ON idea_reactions FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
  ON idea_reactions FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================================================
-- STEP 6: TRIGGER TO UPDATE REACTION COUNTS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_idea_reaction_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'hot' THEN
      UPDATE project_ideas SET hot_count = hot_count + 1 WHERE project_id = NEW.project_id;
    ELSIF NEW.reaction_type = 'cold' THEN
      UPDATE project_ideas SET cold_count = cold_count + 1 WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.reaction_type = 'hot' AND NEW.reaction_type = 'cold' THEN
      UPDATE project_ideas 
      SET hot_count = hot_count - 1, cold_count = cold_count + 1 
      WHERE project_id = NEW.project_id;
    ELSIF OLD.reaction_type = 'cold' AND NEW.reaction_type = 'hot' THEN
      UPDATE project_ideas 
      SET hot_count = hot_count + 1, cold_count = cold_count - 1 
      WHERE project_id = NEW.project_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'hot' THEN
      UPDATE project_ideas SET hot_count = hot_count - 1 WHERE project_id = OLD.project_id;
    ELSIF OLD.reaction_type = 'cold' THEN
      UPDATE project_ideas SET cold_count = cold_count - 1 WHERE project_id = OLD.project_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_reaction_counts_trigger ON idea_reactions;
CREATE TRIGGER update_reaction_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON idea_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_reaction_counts();

-- ============================================================================
-- STEP 7: TRIGGER TO SET IDEA_MAKER STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_idea_maker_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET is_idea_maker = true
  WHERE id = (SELECT user_id FROM projects WHERE id = NEW.project_id)
  AND is_idea_maker = false;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_idea_maker_on_idea_create ON project_ideas;
CREATE TRIGGER set_idea_maker_on_idea_create
  AFTER INSERT ON project_ideas
  FOR EACH ROW
  EXECUTE FUNCTION set_idea_maker_status();

-- ============================================================================
-- STEP 8: UPDATE TIMESTAMPS TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_project_ideas_updated_at ON project_ideas;
CREATE TRIGGER update_project_ideas_updated_at
  BEFORE UPDATE ON project_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();