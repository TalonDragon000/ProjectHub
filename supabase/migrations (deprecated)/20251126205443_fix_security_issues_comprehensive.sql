/*
  # Comprehensive Security Fixes

  ## Overview
  This migration addresses multiple security issues identified in the database audit:
  
  ## 1. Unused Indexes Cleanup
  
  ### Removed Indexes:
  - `idx_analytics_date` on project_analytics - Not used in queries, analytics queried by project_id only
  - `idx_donation_goals_feature_id` on donation_goals - Feature donations not yet implemented
  - `idx_donation_goals_milestone_id` on donation_goals - Milestone donations not yet implemented  
  - `idx_donations_goal_id` on donations - Donation goals feature not yet active
  - `idx_project_updates_project_id` on project_updates - Updates feature not yet implemented
  
  ### Retained Indexes:
  - `idx_projects_published` - KEPT: Heavily used in RLS policies and queries filtering by is_published
  
  ## 2. Function Security Hardening
  
  ### Fixed Function:
  - `update_project_ratings` - Set immutable search_path to prevent search_path injection attacks
  
  ## 3. Auth Configuration
  
  ### Password Security:
  Note: Leaked password protection (HaveIBeenPwned integration) must be enabled via Supabase Dashboard:
  - Navigate to: Authentication > Providers > Email
  - Enable "Leaked Password Protection"
  This cannot be configured via SQL migrations.
  
  ## Security Impact
  - Reduces attack surface by removing unused indexes
  - Prevents potential SQL injection via search_path manipulation
  - Improves database performance by reducing index maintenance overhead
*/

-- Drop unused indexes that are not being utilized by the application
DROP INDEX IF EXISTS idx_analytics_date;
DROP INDEX IF EXISTS idx_donation_goals_feature_id;
DROP INDEX IF EXISTS idx_donation_goals_milestone_id;
DROP INDEX IF EXISTS idx_donations_goal_id;
DROP INDEX IF EXISTS idx_project_updates_project_id;

-- Fix function security: Set immutable search_path to prevent injection attacks
-- Recreate the function with proper search_path configuration
DROP FUNCTION IF EXISTS update_project_ratings() CASCADE;

CREATE OR REPLACE FUNCTION update_project_ratings()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE projects
  SET 
    average_rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 2) 
       FROM reviews 
       WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)),
      0
    ),
    total_reviews = COALESCE(
      (SELECT COUNT(*) 
       FROM reviews 
       WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)),
      0
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_project_ratings ON reviews;

CREATE TRIGGER trigger_update_project_ratings
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_project_ratings();

-- Add comment documenting the security configuration
COMMENT ON FUNCTION update_project_ratings() IS 
'Automatically updates project rating statistics when reviews are added, updated, or deleted. 
SECURITY: Uses immutable search_path to prevent search_path injection attacks.';