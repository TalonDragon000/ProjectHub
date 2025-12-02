/*
  # Create Storage Bucket for Project Hero Images

  ## Overview
  This migration creates a Supabase Storage bucket for storing project hero images
  uploaded by users. Images are stored publicly so they can be displayed on project pages.

  ## Changes Made

  1. Storage Bucket
    - `project-hero-images`: Public bucket for hero images
    - 5MB file size limit
    - Allowed formats: JPEG, JPG, PNG, WebP, GIF

  2. Security (RLS Policies)
    - Public: Anyone can view hero images
    - Authenticated: Users can upload images to hero-images folder
    - Authenticated: Users can update/delete their own uploaded images

  ## Important Notes
  - Images are stored in public bucket for easy display
  - File path structure: hero-images/{user-id}-{timestamp}.{ext}
  - RLS ensures users can only modify their own uploads
*/

-- ============================================================================
-- STEP 1: CREATE STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-hero-images',
  'project-hero-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: RLS POLICIES FOR STORAGE OBJECTS
-- ============================================================================

-- Anyone can view hero images (public bucket)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public hero images are viewable by everyone'
  ) THEN
    CREATE POLICY "Public hero images are viewable by everyone"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'project-hero-images');
  END IF;
END $$;

-- Authenticated users can upload hero images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload hero images'
  ) THEN
    CREATE POLICY "Users can upload hero images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'project-hero-images' AND
        (storage.foldername(name))[1] = 'hero-images'
      );
  END IF;
END $$;

-- Users can update their own uploaded images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can update their own hero images'
  ) THEN
    CREATE POLICY "Users can update their own hero images"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'project-hero-images');
  END IF;
END $$;

-- Users can delete their own uploaded images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete their own hero images'
  ) THEN
    CREATE POLICY "Users can delete their own hero images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'project-hero-images');
  END IF;
END $$;