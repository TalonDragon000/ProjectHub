/*
  # Fix Project Links RLS Policies
  
  The previous policies referenced the dropped creator_profiles table.
  This migration creates correct policies using the profiles table.
  
  1. Changes
    - Drop all existing broken project_links policies
    - Create new SELECT policy for public access to published project links
    - Create new INSERT policy for authenticated users to add links to their projects
    - Create new UPDATE policy for authenticated users to modify their project links
    - Create new DELETE policy for authenticated users to remove their project links
  
  2. Security
    - All policies properly join through profiles table
    - Public can only view links for published projects
    - Authenticated users can only manage links for their own projects
    - Ownership validation through projects -> profiles -> auth.uid() chain
*/

-- Drop ALL existing project_links policies (they're broken)
DROP POLICY IF EXISTS "Anyone can view links for published projects" ON project_links;
DROP POLICY IF EXISTS "Creators can manage links for own projects" ON project_links;
DROP POLICY IF EXISTS "Creators can update links for own projects" ON project_links;
DROP POLICY IF EXISTS "Creators can delete links for own projects" ON project_links;
DROP POLICY IF EXISTS "Users can insert links for own projects" ON project_links;
DROP POLICY IF EXISTS "Users can update links for own projects" ON project_links;

-- SELECT: Anyone can view links for published projects
CREATE POLICY "Anyone can view links for published projects"
  ON project_links FOR SELECT
  TO public
  USING (project_id IN (SELECT id FROM projects WHERE is_published = true));

-- INSERT: Users can insert links for their own projects
CREATE POLICY "Users can insert links for own projects"
  ON project_links FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON p.user_id = pr.id
      WHERE pr.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update links for their own projects
CREATE POLICY "Users can update links for own projects"
  ON project_links FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON p.user_id = pr.id
      WHERE pr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON p.user_id = pr.id
      WHERE pr.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete links for their own projects
CREATE POLICY "Users can delete links for own projects"
  ON project_links FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON p.user_id = pr.id
      WHERE pr.user_id = auth.uid()
    )
  );
