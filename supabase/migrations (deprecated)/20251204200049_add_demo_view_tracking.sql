/*
  # Demo View Tracking System
  
  ## Overview
  Tracks demo link clicks and awards XP to project owners when users view their demos.
  Max 1 XP per viewer per project to prevent farming.
  
  ## New Table
  
  ### demo_views
  - Tracks which users have viewed which project demos
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `viewer_profile_id` (uuid, references profiles, nullable for anonymous)
  - `viewer_session_id` (text, for anonymous tracking)
  - `link_id` (uuid, references project_links, optional)
  - `created_at` (timestamp)
  - Unique constraint on (project_id, viewer_profile_id) for authenticated
  - Unique constraint on (project_id, viewer_session_id) for anonymous
  
  ## XP Award Logic
  - When a demo link is clicked for the first time by a user:
    - Award 1 XP to project owner
    - Record the view in demo_views table
  - Subsequent views from same user = no XP
  
  ## Security
  - RLS enabled
  - Anyone can insert (to track views)
  - Users can view own views
  - Project owners can view all views for their projects
*/

-- Create demo_views table
CREATE TABLE IF NOT EXISTS demo_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  viewer_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_session_id text,
  link_id uuid REFERENCES project_links(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CHECK (
    (viewer_profile_id IS NOT NULL AND viewer_session_id IS NULL) OR
    (viewer_profile_id IS NULL AND viewer_session_id IS NOT NULL)
  )
);

ALTER TABLE demo_views ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_demo_views_project_id ON demo_views(project_id);
CREATE INDEX IF NOT EXISTS idx_demo_views_viewer_profile_id ON demo_views(viewer_profile_id) WHERE viewer_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_demo_views_viewer_session_id ON demo_views(viewer_session_id) WHERE viewer_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_views_unique_profile ON demo_views(project_id, viewer_profile_id) WHERE viewer_profile_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_views_unique_session ON demo_views(project_id, viewer_session_id) WHERE viewer_session_id IS NOT NULL;

-- RLS Policies
CREATE POLICY "Anyone can insert demo views"
  ON demo_views FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view own demo views"
  ON demo_views FOR SELECT
  TO authenticated
  USING (
    viewer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Project owners can view all views for their projects"
  ON demo_views FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.id = p.user_id
      WHERE pr.user_id = auth.uid()
    )
  );

-- Function to record demo view and award XP
CREATE OR REPLACE FUNCTION record_demo_view_and_award_xp(
  p_project_id uuid,
  p_viewer_profile_id uuid DEFAULT NULL,
  p_viewer_session_id text DEFAULT NULL,
  p_link_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  project_owner_id uuid;
  existing_view_id uuid;
  new_view_id uuid;
  xp_awarded boolean := false;
BEGIN
  -- Get project owner
  SELECT user_id INTO project_owner_id
  FROM projects
  WHERE id = p_project_id;
  
  IF project_owner_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Project not found'
    );
  END IF;
  
  -- Check if view already exists
  IF p_viewer_profile_id IS NOT NULL THEN
    SELECT id INTO existing_view_id
    FROM demo_views
    WHERE project_id = p_project_id
      AND viewer_profile_id = p_viewer_profile_id;
  ELSIF p_viewer_session_id IS NOT NULL THEN
    SELECT id INTO existing_view_id
    FROM demo_views
    WHERE project_id = p_project_id
      AND viewer_session_id = p_viewer_session_id;
  END IF;
  
  -- If view doesn't exist, create it and award XP
  IF existing_view_id IS NULL THEN
    -- Insert demo view
    INSERT INTO demo_views (
      project_id,
      viewer_profile_id,
      viewer_session_id,
      link_id
    ) VALUES (
      p_project_id,
      p_viewer_profile_id,
      p_viewer_session_id,
      p_link_id
    )
    RETURNING id INTO new_view_id;
    
    -- Award XP to project owner
    PERFORM award_xp(
      project_owner_id,
      1,
      'demo_view_received',
      p_project_id,
      NULL,
      NULL,
      jsonb_build_object(
        'viewer_profile_id', p_viewer_profile_id,
        'viewer_session_id', p_viewer_session_id,
        'link_id', p_link_id
      )
    );
    
    xp_awarded := true;
  END IF;
  
  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'xp_awarded', xp_awarded,
    'view_id', COALESCE(new_view_id, existing_view_id),
    'project_owner_id', project_owner_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update project_links click_count when demo view is recorded
CREATE OR REPLACE FUNCTION increment_link_click_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.link_id IS NOT NULL THEN
    UPDATE project_links
    SET click_count = click_count + 1
    WHERE id = NEW.link_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_link_click_count ON demo_views;
CREATE TRIGGER trigger_increment_link_click_count
  AFTER INSERT ON demo_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_link_click_count();
