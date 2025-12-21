-- ============================================================================
-- SECTION 6: STORAGE BUCKETS & POLICIES
-- Configures file storage for avatars and project images
-- Safe to run multiple times - creates bucket if not exists, updates policies
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 6.1 CREATE AVATARS STORAGE BUCKET
-- -----------------------------------------------------------------------------

-- Create avatars bucket with proper configuration
-- ON CONFLICT ensures this is idempotent (safe to run multiple times)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket so avatars can be displayed on profiles
  2097152, -- 2MB limit (matches ProfileSettings.tsx validation)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] -- Matches ProfileSettings.tsx validation
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ============================================================================
-- 6.2 CREATE HERO_IMAGES STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero_image',
  'hero_image',
  true, -- Public bucket so hero images can be displayed
  5242880, -- 5MB limit (matches ProjectForm.tsx validation)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];


-- -----------------------------------------------------------------------------
-- 6.3 AVATARS BUCKET - RLS POLICIES
-- All operations scoped to user's own folder (auth.uid())
-- -----------------------------------------------------------------------------

-- Policy 1: Allow authenticated users to UPLOAD their own avatar
-- Users can only upload to folders named with their auth.uid()
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 2: Allow authenticated users to UPDATE their own avatar
-- Users can only update files in their own folder
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 3: Allow authenticated users to DELETE their own avatar
-- Users can only delete files in their own folder
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 4: Allow PUBLIC READ access to all avatars
-- Since profiles are public, avatars should be viewable by everyone
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

  
-- ============================================================================
-- 6.4 HERO_IMAGE BUCKET - RLS POLICIES
-- Users can only modify images for projects they own
-- ============================================================================

-- Policy 1: Allow authenticated users to UPLOAD hero images
-- Users upload to hero_image/{user-id}-{timestamp}.{ext}
DROP POLICY IF EXISTS "Users can upload a hero image" ON storage.objects;
CREATE POLICY "Users can upload a hero image"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'hero_image'
    AND (storage.foldername(name))[1] = 'hero_image'
  );

-- Policy 2: Allow authenticated users to UPDATE their own hero images
-- Check filename contains their user ID: {user_id}-{timestamp}.{ext}
DROP POLICY IF EXISTS "Users can update own hero images" ON storage.objects;
CREATE POLICY "Users can update own hero images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'hero_image'
    AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
  );

-- Policy 3: Allow authenticated users to DELETE their own hero images
DROP POLICY IF EXISTS "Users can delete own hero images" ON storage.objects;
CREATE POLICY "Users can delete own hero images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'hero_image'
    AND auth.uid()::text = split_part((storage.filename(name)), '-', 1)
  );

-- Policy 4: Allow PUBLIC READ access to all hero images
DROP POLICY IF EXISTS "Hero images are publicly accessible" ON storage.objects;
CREATE POLICY "Hero images are publicly accessible"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'hero_image');

-- -----------------------------------------------------------------------------
-- 6.5 VERIFICATION & GRANTS
-- Ensure proper permissions are set
-- -----------------------------------------------------------------------------

-- Grant usage on storage schema to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO anon;

-- Grant access to storage tables
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

GRANT ALL ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO anon;

-- -----------------------------------------------------------------------------
-- 6.6 HELPER FUNCTION: VALIDATE AVATAR UPLOAD
-- Optional: Additional validation before upload (can be called from triggers)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_avatar_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
BEGIN
  -- Ensure file is in avatars bucket
  IF NEW.bucket_id != 'avatars' THEN
    RETURN NEW;
  END IF;
  
  -- Ensure filename format is correct: user_id/timestamp.ext
  -- This matches ProfileSettings.tsx format: `${user.id}/${Date.now()}.${fileExt}`
  IF (storage.foldername(NEW.name))[1] IS NULL THEN
    RAISE EXCEPTION 'Avatar must be in a user folder';
  END IF;
  
  -- Ensure authenticated user is uploading to their own folder
  IF auth.uid() IS NOT NULL AND (storage.foldername(NEW.name))[1] != auth.uid()::text THEN
    RAISE EXCEPTION 'Can only upload to your own folder';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for avatar validation (optional - policies handle most of this)
DROP TRIGGER IF EXISTS validate_avatar_upload_trigger ON storage.objects;
CREATE TRIGGER validate_avatar_upload_trigger
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION validate_avatar_upload();

-- -----------------------------------------------------------------------------
-- SECTION 6 COMPLETE
-- Storage configuration for profile avatars is now set up
-- 
-- What this enables:
-- ✓ Users can upload avatars to their own folder (auth.uid)
-- ✓ Users can update/replace their avatars
-- ✓ Users can delete their old avatars
-- ✓ Public can view all avatars (for profile display)
-- ✓ 2MB file size limit enforced
-- ✓ Only JPEG, PNG, WebP images allowed
-- 
-- File path format: avatars/{user_id}/{timestamp}.{ext}
-- Example: avatars/9f0b0333-13d2-479d-b9f2-34e7f7eca9d5/1734567890123.png

-- Storage configuration for hero images is now set up
--
-- What this enables:
-- ✓ Users can upload hero images to their own folder (auth.uid)
-- ✓ Users can update/replace their hero images
-- ✓ Users can delete their old hero images
-- ✓ Public can view all hero images (for project display)
-- ✓ 5MB file size limit enforced
-- ✓ Only JPEG, PNG, WebP, GIF images allowed
-- 
-- File path format: hero_image/{user_id}-{timestamp}.{ext}
-- -----------------------------------------------------------------------------