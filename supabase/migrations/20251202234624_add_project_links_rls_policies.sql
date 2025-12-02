/*
  # Add RLS Policies for Project Links
  
  1. New Policies
    - `Users can insert links for own projects`
      - Allows authenticated users to insert project links for projects they own
      - Validates ownership by checking if the project's user_id matches the authenticated user
    
    - `Users can update links for own projects`
      - Allows authenticated users to update project links for projects they own
      - Validates ownership by checking if the project's user_id matches the authenticated user
  
  2. Security
    - Both policies use subqueries to verify project ownership through the projects table
    - Ensures users can only manage links for their own projects
    - Follows principle of least privilege for data access control
*/

-- Allow users to insert links for their own projects
CREATE POLICY "Users can insert links for own projects" ON project_links
FOR INSERT 
TO authenticated
WITH CHECK (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

-- Allow users to update links for their own projects  
CREATE POLICY "Users can update links for own projects" ON project_links
FOR UPDATE 
TO authenticated
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
