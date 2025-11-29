/*
  # Fix Security Issues

  1. Performance Improvements
    - Add missing indexes on foreign keys for optimal query performance
    - Remove unused indexes that provide no benefit
  
  2. Security Fixes
    - Remove duplicate permissive RLS policies on creator_profiles
    - Fix function search paths to prevent SQL injection vulnerabilities
  
  3. Changes Made
    - Add indexes: donation_goals (feature_id, milestone_id), donations (goal_id), project_updates (project_id)
    - Drop unused indexes: idx_projects_published, idx_creator_profiles_username
    - Drop duplicate RLS policy: "Anyone can view creator usernames"
    - Update functions with immutable search_path setting
*/

-- Add missing indexes on foreign keys for performance
CREATE INDEX IF NOT EXISTS idx_donation_goals_feature_id ON donation_goals(feature_id);
CREATE INDEX IF NOT EXISTS idx_donation_goals_milestone_id ON donation_goals(milestone_id);
CREATE INDEX IF NOT EXISTS idx_donations_goal_id ON donations(goal_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);

-- Drop unused indexes (they were never being used by queries)
DROP INDEX IF EXISTS idx_projects_published;
DROP INDEX IF EXISTS idx_creator_profiles_username;

-- Remove duplicate permissive policy (the original "Anyone can view creator profiles" already allows public SELECT)
DROP POLICY IF EXISTS "Anyone can view creator usernames" ON creator_profiles;

-- Recreate functions with immutable search_path to prevent SQL injection
DROP FUNCTION IF EXISTS generate_username(text);
CREATE OR REPLACE FUNCTION generate_username(display_name_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  base_username text;
  final_username text;
  counter int := 1;
BEGIN
  -- Convert display name to lowercase, replace spaces with hyphens, remove special chars
  base_username := lower(regexp_replace(display_name_input, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_username := regexp_replace(base_username, '\s+', '-', 'g');
  base_username := regexp_replace(base_username, '-+', '-', 'g');
  base_username := trim(both '-' from base_username);
  
  -- Ensure it's not empty
  IF base_username = '' THEN
    base_username := 'user';
  END IF;
  
  -- Check for uniqueness and append number if needed
  final_username := base_username;
  
  WHILE EXISTS (SELECT 1 FROM creator_profiles WHERE username = final_username) LOOP
    final_username := base_username || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_username;
END;
$$;

DROP FUNCTION IF EXISTS get_random_featured_creators(int);
CREATE OR REPLACE FUNCTION get_random_featured_creators(limit_count int DEFAULT 12)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  username text,
  bio text,
  avatar_url text,
  email_public boolean,
  created_at timestamptz,
  total_projects bigint,
  average_rating numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.user_id,
    cp.display_name,
    cp.username,
    cp.bio,
    cp.avatar_url,
    cp.email_public,
    cp.created_at,
    COUNT(p.id) as total_projects,
    ROUND(AVG(p.average_rating), 1) as average_rating
  FROM creator_profiles cp
  JOIN projects p ON p.creator_id = cp.id
  WHERE p.is_published = true
  GROUP BY cp.id
  HAVING COUNT(p.id) > 0
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$$;