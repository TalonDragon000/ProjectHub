/*
  # Creator Profile Enhancements

  1. Schema Changes
    - Add `username` column to creator_profiles (unique, URL-friendly identifier)
    - Add `email_public` column to control email visibility
    - Generate usernames for existing creators from display_name
  
  2. Database Functions
    - `generate_username()` - Creates URL-friendly usernames from display names
    - `get_random_featured_creators()` - Returns random creators with published projects
  
  3. Security
    - Add RLS policies for new columns
    - Maintain existing security model
  
  4. Data Migration
    - Auto-generate usernames for existing creators
    - Set email_public to false by default
*/

-- Add new columns to creator_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE creator_profiles ADD COLUMN username text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_profiles' AND column_name = 'email_public'
  ) THEN
    ALTER TABLE creator_profiles ADD COLUMN email_public boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create function to generate URL-friendly usernames
CREATE OR REPLACE FUNCTION generate_username(display_name_input text)
RETURNS text
LANGUAGE plpgsql
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

-- Generate usernames for existing creators without usernames
UPDATE creator_profiles
SET username = generate_username(display_name)
WHERE username IS NULL;

-- Now make username NOT NULL since all existing records have values
ALTER TABLE creator_profiles ALTER COLUMN username SET NOT NULL;

-- Create function to get random featured creators
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

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_creator_profiles_username ON creator_profiles(username);

-- Add RLS policy to allow public to read usernames
CREATE POLICY "Anyone can view creator usernames"
  ON creator_profiles FOR SELECT
  TO public
  USING (true);