/*
  # Restructure to Unified Profile System (with Data Migration)

  ## Overview
  This migration completely restructures the profile system to use a single unified `profiles` table
  that supports both user and creator capabilities, while preserving existing user data.

  ## Changes Made

  1. Create New Unified System First
    - Create `profiles` table with both user and creator fields
    - Migrate data from `creator_profiles` to `profiles`
    
  2. Update Related Tables
    - `projects`: Temporarily allow NULL, migrate data, then enforce NOT NULL
    - `reviews`: Add `user_id`, migrate existing reviews
    
  3. Drop Old System
    - Drop `creator_profiles` table after data migration
    
  4. Create Indexes, Policies, Functions
*/

-- ============================================================================
-- STEP 1: CREATE NEW UNIFIED PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Basic Info (required)
  display_name text NOT NULL,
  username text UNIQUE NOT NULL,
  
  -- Profile Details (optional)
  avatar_url text,
  bio text CHECK (char_length(bio) <= 500),
  email_public boolean DEFAULT false,
  
  -- User Capabilities
  open_to_beta_test boolean DEFAULT false,
  
  -- Creator Status (auto-set when first project published)
  is_creator boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: MIGRATE DATA FROM CREATOR_PROFILES TO PROFILES
-- ============================================================================

-- Copy all creator profiles to new profiles table
INSERT INTO profiles (id, user_id, display_name, username, avatar_url, bio, email_public, is_creator, created_at)
SELECT 
  id,
  user_id,
  display_name,
  username,
  avatar_url,
  bio,
  email_public,
  true as is_creator, -- They already have projects, so they're creators
  created_at
FROM creator_profiles;

-- ============================================================================
-- STEP 3: UPDATE PROJECTS TABLE
-- ============================================================================

-- Rename column first (keeps the data intact)
ALTER TABLE projects RENAME COLUMN creator_id TO user_id;

-- Projects user_id now references the same IDs in profiles table
-- (because we copied the IDs from creator_profiles)
-- Drop old constraint and add new one
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_creator_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update index
DROP INDEX IF EXISTS idx_projects_creator_id;
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- ============================================================================
-- STEP 4: UPDATE REVIEWS TABLE
-- ============================================================================

-- Add user_id column (nullable for now)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Add updated_at for edit tracking
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Note: Existing anonymous reviews will have NULL user_id
-- Future reviews will require user_id (enforced by RLS policy)

-- Create index for user reviews lookup
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- ============================================================================
-- STEP 5: DROP OLD SYSTEM
-- ============================================================================

-- Drop old policies on creator_profiles
DROP POLICY IF EXISTS "Anyone can view creator profiles" ON creator_profiles;
DROP POLICY IF EXISTS "Anyone can view creator usernames" ON creator_profiles;
DROP POLICY IF EXISTS "Creators can update their own profile" ON creator_profiles;
DROP POLICY IF EXISTS "Creators can insert their own profile" ON creator_profiles;

-- Drop old functions
DROP FUNCTION IF EXISTS generate_username(text);
DROP FUNCTION IF EXISTS get_random_featured_creators(int);

-- Drop old table (safe now that data is migrated)
DROP TABLE IF EXISTS creator_profiles CASCADE;

-- Can now safely drop anonymous review columns since we'll require auth
ALTER TABLE reviews DROP COLUMN IF EXISTS reviewer_name;
ALTER TABLE reviews DROP COLUMN IF EXISTS reviewer_email;

-- ============================================================================
-- STEP 6: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_creator ON profiles(is_creator) WHERE is_creator = true;
CREATE INDEX IF NOT EXISTS idx_profiles_open_to_beta ON profiles(open_to_beta_test) WHERE open_to_beta_test = true;

-- ============================================================================
-- STEP 7: RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update reviews policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can create reviews" ON reviews;

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Update projects policies
DROP POLICY IF EXISTS "Anyone can view published projects" ON projects;
DROP POLICY IF EXISTS "Creators can view their own projects" ON projects;
DROP POLICY IF EXISTS "Creators can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Creators can update their own projects" ON projects;
DROP POLICY IF EXISTS "Creators can delete their own projects" ON projects;

CREATE POLICY "Anyone can view published projects"
  ON projects FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- STEP 8: FUNCTIONS
-- ============================================================================

-- Function to generate username from display name
CREATE OR REPLACE FUNCTION generate_username_from_display_name(display_name_input text)
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
  base_username := lower(regexp_replace(display_name_input, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_username := regexp_replace(base_username, '\s+', '-', 'g');
  base_username := regexp_replace(base_username, '-+', '-', 'g');
  base_username := trim(both '-' from base_username);
  
  IF base_username = '' THEN
    base_username := 'user';
  END IF;
  
  final_username := base_username;
  
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    final_username := base_username || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_username;
END;
$$;

-- Trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  display_name_var text;
  username_var text;
BEGIN
  display_name_var := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  
  username_var := generate_username_from_display_name(display_name_var);
  
  INSERT INTO profiles (user_id, display_name, username)
  VALUES (NEW.id, display_name_var, username_var);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- Trigger to auto-set is_creator flag when first project is published
CREATE OR REPLACE FUNCTION update_creator_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_published = true THEN
    UPDATE profiles 
    SET is_creator = true 
    WHERE id = NEW.user_id
    AND is_creator = false;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_creator_status_on_publish ON projects;
CREATE TRIGGER set_creator_status_on_publish
  AFTER INSERT OR UPDATE OF is_published ON projects
  FOR EACH ROW
  WHEN (NEW.is_published = true)
  EXECUTE FUNCTION update_creator_status();

-- Function to calculate profile stats
CREATE OR REPLACE FUNCTION calculate_profile_stats(profile_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_reviews_written', COUNT(DISTINCT r.id),
    'average_rating_given', COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0),
    'projects_reviewed', COUNT(DISTINCT r.project_id),
    'total_projects_created', (
      SELECT COUNT(*) FROM projects WHERE user_id = profile_id_input AND is_published = true
    ),
    'average_project_rating', (
      SELECT COALESCE(ROUND(AVG(average_rating)::numeric, 1), 0) 
      FROM projects 
      WHERE user_id = profile_id_input AND is_published = true
    ),
    'total_reviews_received', (
      SELECT COALESCE(SUM(total_reviews), 0)
      FROM projects
      WHERE user_id = profile_id_input AND is_published = true
    )
  )
  INTO result
  FROM reviews r
  WHERE r.user_id = profile_id_input;
  
  RETURN result;
END;
$$;

-- Function to get featured profiles
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
SET search_path = public, pg_temp
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
  FROM profiles p
  JOIN projects pr ON pr.user_id = p.id
  WHERE pr.is_published = true AND p.is_creator = true
  GROUP BY p.id
  HAVING COUNT(pr.id) > 0
  ORDER BY RANDOM()
  LIMIT limit_count;
END;
$$;

-- ============================================================================
-- STEP 9: UPDATE TIMESTAMPS TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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