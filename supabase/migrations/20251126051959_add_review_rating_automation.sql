/*
  # Add Review Rating Automation

  This migration adds automatic calculation of average ratings and total review counts
  for projects whenever reviews are added, updated, or deleted.

  1. New Functions
    - `update_project_ratings()` - Calculates and updates average_rating and total_reviews
      for a project based on all its reviews
    
  2. New Triggers
    - `reviews_rating_trigger` - Fires on INSERT, UPDATE, or DELETE of reviews
      Automatically updates the project's rating statistics
  
  3. Changes
    - Ensures rating calculations are always accurate and up-to-date
    - Eliminates need for manual rating updates
    - Provides real-time rating synchronization
  
  4. Important Notes
    - The function handles edge cases like zero reviews (sets average to 0)
    - Ratings are rounded to 2 decimal places for precision
    - Trigger fires AFTER the review operation completes
    - Works for both INSERT and DELETE operations using COALESCE
*/

-- Create function to update project ratings
CREATE OR REPLACE FUNCTION update_project_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the project's average rating and total reviews
  -- Use COALESCE to get the project_id from either NEW (INSERT/UPDATE) or OLD (DELETE)
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
$$ LANGUAGE plpgsql;

-- Create trigger that fires after any review changes
DROP TRIGGER IF EXISTS reviews_rating_trigger ON reviews;

CREATE TRIGGER reviews_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_project_ratings();
