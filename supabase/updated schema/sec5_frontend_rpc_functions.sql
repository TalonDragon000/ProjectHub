-- ============================================================================
-- SECTION 5: FRONTEND RPC FUNCTIONS
-- Additional functions needed by the frontend
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 GET FEATURED PROFILES
-- Returns random featured creators for the home page
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_featured_profiles(limit_count integer DEFAULT 12)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM profiles
  WHERE is_creator = true
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5.2 INCREMENT (Generic increment function)
-- Used for incrementing counters like link clicks
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment(row_id uuid, table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF table_name = 'project_links' THEN
    UPDATE project_links
    SET click_count = click_count + 1
    WHERE id = row_id;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5.3 GET LEADERBOARD
-- Returns top users by XP for leaderboard display
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  total_xp integer,
  xp_level integer,
  leaderboard_rank integer,
  is_first_100 boolean,
  is_top_100 boolean,
  is_creator boolean,
  is_idea_maker boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.username,
    p.avatar_url,
    p.total_xp,
    p.xp_level,
    p.leaderboard_rank,
    p.is_first_100,
    p.is_top_100,
    p.is_creator,
    p.is_idea_maker
  FROM profiles p
  WHERE p.total_xp > 0
  ORDER BY p.total_xp DESC, p.created_at ASC
  LIMIT limit_count;
END;
$$;