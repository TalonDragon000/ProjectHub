/*
  # Filter Zero XP Users from Leaderboard

  1. Changes to Leaderboard Ranking
    - Users with 0 total_xp are excluded from leaderboard rankings
    - Only users with at least 1 XP will have a leaderboard_rank
    - Maintains bot filtering (is_flagged_bot = false)
    
  2. Updates
    - Modified `update_leaderboard_ranks()` function to filter total_xp > 0
    - Users with 0 XP will have NULL leaderboard_rank
    - is_top_100 badge only available to users with XP
    
  3. Important Notes
    - New users start with 0 XP and won't appear on leaderboard
    - Once they earn their first XP, they'll be ranked
    - This prevents empty profiles from cluttering the leaderboard
*/

-- Update leaderboard ranks function to exclude 0 XP users
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS void AS $$
BEGIN
  -- First, clear ranks for users with 0 XP
  UPDATE profiles
  SET leaderboard_rank = NULL,
      is_top_100 = false
  WHERE total_xp = 0;
  
  -- Update ranks based on total_xp (only for users with XP > 0)
  WITH ranked_profiles AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY total_xp DESC, created_at ASC) as new_rank
    FROM profiles
    WHERE is_flagged_bot = false
      AND total_xp > 0
  )
  UPDATE profiles p
  SET leaderboard_rank = rp.new_rank
  FROM ranked_profiles rp
  WHERE p.id = rp.id;
  
  -- Update is_top_100 badge (only for users with rank)
  UPDATE profiles
  SET is_top_100 = (leaderboard_rank IS NOT NULL AND leaderboard_rank <= 100);
END;
$$ LANGUAGE plpgsql;

-- Refresh leaderboard to apply new filter
SELECT update_leaderboard_ranks();
