/*
  # Fix RLS Performance and Security Issues

  ## Overview
  This migration addresses multiple security and performance issues identified by Supabase:
  1. Optimize RLS policies to prevent re-evaluation of auth functions
  2. Remove duplicate and conflicting policies
  3. Drop unused indexes
  4. Remove duplicate indexes
  5. Fix function search paths

  ## Changes Made

  1. RLS Policy Optimization
    - Replace `auth.uid()` with `(select auth.uid())` in all policies for better performance
    
  2. Remove Conflicting Policies
    - Clean up multiple permissive policies on same table/role/action
    - Keep only the necessary policies
    
  3. Index Cleanup
    - Drop unused indexes
    - Remove duplicate indexes
    
  4. Function Security
    - Fix search_path on functions to be immutable
*/

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES TO START FRESH
-- ============================================================================

-- Drop profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop reviews policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Anyone can view reviews for published projects" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can submit reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

-- Drop projects policies
DROP POLICY IF EXISTS "Anyone can view published projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- ============================================================================
-- STEP 2: CREATE OPTIMIZED RLS POLICIES
-- ============================================================================

-- Profiles policies (optimized with select auth.uid())
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Reviews policies (optimized, no duplicates)
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = (select auth.uid()))
  )
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = (select auth.uid()))
  );

-- Projects policies (optimized, combined view policies)
CREATE POLICY "Users can view published or own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    is_published = true 
    OR user_id IN (SELECT id FROM profiles WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Public can view published projects"
  ON projects FOR SELECT
  TO anon
  USING (is_published = true);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = (select auth.uid())));

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (select auth.uid())))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = (select auth.uid())));

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = (select auth.uid())));

-- ============================================================================
-- STEP 3: DROP UNUSED INDEXES
-- ============================================================================

-- Note: We keep the indexes as they'll be used as the app scales
-- Unused now doesn't mean unused in production with real traffic
-- Only drop truly duplicate ones

-- Drop duplicate project index (keeping idx_projects_user_id, dropping old one)
DROP INDEX IF EXISTS idx_projects_creator;

-- ============================================================================
-- STEP 4: FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Recreate update_updated_at_column with immutable search_path
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fix other functions with search_path issues
DROP FUNCTION IF EXISTS create_profile_for_user() CASCADE;

CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  display_name_var text;
  username_var text;
BEGIN
  display_name_var := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  
  username_var := (SELECT public.generate_username_from_display_name(display_name_var));
  
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (NEW.id, display_name_var, username_var);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

DROP FUNCTION IF EXISTS update_creator_status() CASCADE;

CREATE OR REPLACE FUNCTION update_creator_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_published = true THEN
    UPDATE public.profiles 
    SET is_creator = true 
    WHERE id = NEW.user_id
    AND is_creator = false;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_creator_status_on_publish
  AFTER INSERT OR UPDATE OF is_published ON projects
  FOR EACH ROW
  WHEN (NEW.is_published = true)
  EXECUTE FUNCTION update_creator_status();

DROP FUNCTION IF EXISTS generate_username_from_display_name(text);

CREATE OR REPLACE FUNCTION generate_username_from_display_name(display_name_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  base_username text;
  final_username text;
  counter int := 1;
BEGIN
  base_username := lower(regexp_replace(display_name_input, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_username := regexp_replace(base_username, '\s+', '-', 'g');
  base_username := regexp_replace(base_username, '-+', '-', 'g');
  base_username := trim(both '-' from base_username);
  
  IF base_username = '' THEN
    base_username := 'user';
  END IF;
  
  final_username := base_username;
  
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_username;
END;
$$;

DROP FUNCTION IF EXISTS calculate_profile_stats(uuid);

CREATE OR REPLACE FUNCTION calculate_profile_stats(profile_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_reviews_written', COUNT(DISTINCT r.id),
    'average_rating_given', COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0),
    'projects_reviewed', COUNT(DISTINCT r.project_id),
    'total_projects_created', (
      SELECT COUNT(*) FROM public.projects WHERE user_id = profile_id_input AND is_published = true
    ),
    'average_project_rating', (
      SELECT COALESCE(ROUND(AVG(average_rating)::numeric, 1), 0) 
      FROM public.projects 
      WHERE user_id = profile_id_input AND is_published = true
    ),
    'total_reviews_received', (
      SELECT COALESCE(SUM(total_reviews), 0)
      FROM public.projects
      WHERE user_id = profile_id_input AND is_published = true
    )
  )
  INTO result
  FROM public.reviews r
  WHERE r.user_id = profile_id_input;
  
  RETURN result;
END;
$$;

DROP FUNCTION IF EXISTS get_featured_profiles(int);

CREATE OR REPLACE FUNCTION get_featured_profiles(limit_count int DEFAULT 12)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  username text,
  bio text,
  avatar_url text,
  open_to_beta_test boolean,
  is_creator boolean,
  created_at timestamptz,
  total_projects bigint,
  average_rating numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.username,
    p.bio,
    p.avatar_url,
    p.open_to_beta_test,
    p.is_creator,
    p.created_at,
    COUNT(pr.id) as total_projects,
    ROUND(AVG(pr.average_rating)::numeric, 1) as average_rating
  FROM public.profiles p
  JOIN public.projects pr ON pr.user_id = p.id
  WHERE pr.is_published = true AND p.is_creator = true
  GROUP BY p.id
  HAVING COUNT(pr.id) > 0
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$$;

-- ============================================================================
-- STEP 5: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
  'Optimized policy using (select auth.uid()) to prevent re-evaluation per row';

COMMENT ON POLICY "Authenticated users can create reviews" ON reviews IS 
  'Optimized policy using (select auth.uid()) to prevent re-evaluation per row';

COMMENT ON POLICY "Users can update own reviews" ON reviews IS 
  'Optimized policy using (select auth.uid()) to prevent re-evaluation per row';

COMMENT ON POLICY "Users can delete own reviews" ON reviews IS 
  'Optimized policy using (select auth.uid()) to prevent re-evaluation per row';

COMMENT ON POLICY "Users can view published or own projects" ON projects IS 
  'Combined policy for authenticated users - view published OR own projects. Optimized with (select auth.uid())';

COMMENT ON POLICY "Users can insert their own projects" ON projects IS 
  'Optimized policy using (select auth.uid()) to prevent re-evaluation per row';

COMMENT ON POLICY "Users can update their own projects" ON projects IS 
  'Optimized policy using (select auth.uid()) to prevent re-evaluation per row';

COMMENT ON POLICY "Users can delete their own projects" ON projects IS 
  'Optimized policy using (select auth.uid()) to prevent re-evaluation per row';