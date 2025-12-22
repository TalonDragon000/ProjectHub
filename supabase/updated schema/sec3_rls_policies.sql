-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY POLICIES
-- Safe to run multiple times - drops existing policies before creating
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 PROFILES POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3.2 PROJECTS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Published projects are viewable by everyone" ON projects;
CREATE POLICY "Published projects are viewable by everyone"
  ON projects FOR SELECT TO public
  USING (is_published = true);

DROP POLICY IF EXISTS "Users can view own unpublished projects" ON projects;
CREATE POLICY "Users can view own unpublished projects"
  ON projects FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 3.3 REVIEWS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anonymous users can insert reviews" ON reviews;
CREATE POLICY "Anonymous users can insert reviews"
  ON reviews FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update own reviews" ON reviews;
CREATE POLICY "Authenticated users can update own reviews"
  ON reviews FOR UPDATE TO authenticated
  USING (auth.uid() = created_by_auth_uid);

DROP POLICY IF EXISTS "Authenticated users can delete own reviews" ON reviews;
CREATE POLICY "Authenticated users can delete own reviews"
  ON reviews FOR DELETE TO authenticated
  USING (auth.uid() = created_by_auth_uid);

-- -----------------------------------------------------------------------------
-- 3.4 QUICK_FEEDBACK POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Feedback viewable for published projects" ON quick_feedback;
CREATE POLICY "Feedback viewable for published projects"
  ON quick_feedback FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = quick_feedback.project_id 
    AND projects.is_published = true
  ));

DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON quick_feedback;
CREATE POLICY "Authenticated users can insert feedback"
  ON quick_feedback FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update own feedback" ON quick_feedback;
CREATE POLICY "Authenticated users can update own feedback"
  ON quick_feedback FOR UPDATE TO authenticated
  USING (auth.uid() = created_by_auth_uid);

DROP POLICY IF EXISTS "Authenticated users can delete own feedback" ON quick_feedback;
CREATE POLICY "Authenticated users can delete own feedback"
  ON quick_feedback FOR DELETE TO authenticated
  USING (auth.uid() = created_by_auth_uid);

-- -----------------------------------------------------------------------------
-- 3.5 PROJECT IDEAS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Ideas viewable for published projects" ON project_ideas;
CREATE POLICY "Ideas viewable for published projects"
  ON project_ideas FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_ideas.project_id 
    AND projects.is_published = true
  ));

DROP POLICY IF EXISTS "Owners can view own project ideas" ON project_ideas;
CREATE POLICY "Owners can view own project ideas"
  ON project_ideas FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE p.id = project_ideas.project_id
    AND pr.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Owners can insert project ideas" ON project_ideas;
CREATE POLICY "Owners can insert project ideas"
  ON project_ideas FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE p.id = project_ideas.project_id
    AND pr.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Owners can update project ideas" ON project_ideas;
CREATE POLICY "Owners can update project ideas"
  ON project_ideas FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE p.id = project_ideas.project_id
    AND pr.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Owners can delete project ideas" ON project_ideas;
CREATE POLICY "Owners can delete project ideas"
  ON project_ideas FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE p.id = project_ideas.project_id
    AND pr.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- 3.6 IDEA REACTIONS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON idea_reactions;
CREATE POLICY "Reactions are viewable by everyone"
  ON idea_reactions FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reactions" ON idea_reactions;
CREATE POLICY "Authenticated users can insert reactions"
  ON idea_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anonymous users can insert reactions" ON idea_reactions;
CREATE POLICY "Anonymous users can insert reactions"
  ON idea_reactions FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update own reactions" ON idea_reactions;
CREATE POLICY "Authenticated users can update own reactions"
  ON idea_reactions FOR UPDATE TO authenticated
  USING (auth.uid() = created_by_auth_uid);

DROP POLICY IF EXISTS "Authenticated users can delete own reactions" ON idea_reactions;
CREATE POLICY "Authenticated users can delete own reactions"
  ON idea_reactions FOR DELETE TO authenticated
  USING (auth.uid() = created_by_auth_uid);

DROP POLICY IF EXISTS "Anonymous users can delete own reactions" ON idea_reactions;
CREATE POLICY "Anonymous users can delete own reactions"
  ON idea_reactions FOR DELETE TO anon
  USING (user_id IS NULL AND session_id IS NOT NULL);

-- -----------------------------------------------------------------------------
-- 3.7 FEATURES POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Features viewable for published projects" ON features;
CREATE POLICY "Features viewable for published projects"
  ON features FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = features.project_id 
    AND projects.is_published = true
  ));

DROP POLICY IF EXISTS "Project owners can manage features" ON features;
CREATE POLICY "Project owners can manage features"
  ON features FOR ALL TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE pr.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- 3.8 MILESTONES POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Milestones viewable for published projects" ON milestones;
CREATE POLICY "Milestones viewable for published projects"
  ON milestones FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = milestones.project_id 
    AND projects.is_published = true
  ));

DROP POLICY IF EXISTS "Project owners can manage milestones" ON milestones;
CREATE POLICY "Project owners can manage milestones"
  ON milestones FOR ALL TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE pr.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- 3.9 DONATION GOALS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Donation goals viewable for published projects" ON donation_goals;
CREATE POLICY "Donation goals viewable for published projects"
  ON donation_goals FOR SELECT TO public
  USING (project_id IS NULL OR EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = donation_goals.project_id 
    AND projects.is_published = true
  ));

DROP POLICY IF EXISTS "Project owners can manage donation goals" ON donation_goals;
CREATE POLICY "Project owners can manage donation goals"
  ON donation_goals FOR ALL TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE pr.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- 3.10 DONATIONS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Donations are viewable by everyone" ON donations;
CREATE POLICY "Donations are viewable by everyone"
  ON donations FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert donations" ON donations;
CREATE POLICY "Anyone can insert donations"
  ON donations FOR INSERT TO public
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3.11 PROJECT LINKS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Project links viewable for published projects" ON project_links;
CREATE POLICY "Project links viewable for published projects"
  ON project_links FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_links.project_id 
    AND projects.is_published = true
  ));

DROP POLICY IF EXISTS "Project owners can manage links" ON project_links;
CREATE POLICY "Project owners can manage links"
  ON project_links FOR ALL TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE pr.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- 3.12 PROJECT ANALYTICS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert analytics" ON project_analytics;
CREATE POLICY "Anyone can insert analytics"
  ON project_analytics FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Project owners can view analytics" ON project_analytics;
CREATE POLICY "Project owners can view analytics"
  ON project_analytics FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE pr.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- 3.13 PROJECT UPDATES POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Updates viewable for published projects" ON project_updates;
CREATE POLICY "Updates viewable for published projects"
  ON project_updates FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_updates.project_id 
    AND projects.is_published = true
  ));

DROP POLICY IF EXISTS "Project owners can manage updates" ON project_updates;
CREATE POLICY "Project owners can manage updates"
  ON project_updates FOR ALL TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE pr.user_id = auth.uid()
  ));

-- -----------------------------------------------------------------------------
-- 3.14 CONVERSATIONS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = participant_1_id
    UNION
    SELECT user_id FROM profiles WHERE id = participant_2_id
  ));

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = participant_1_id
    UNION
    SELECT user_id FROM profiles WHERE id = participant_2_id
  ));

DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE TO authenticated
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = participant_1_id
    UNION
    SELECT user_id FROM profiles WHERE id = participant_2_id
  ));

-- -----------------------------------------------------------------------------
-- 3.15 MESSAGES POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT TO authenticated
  USING (conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN profiles p1 ON p1.id = c.participant_1_id
    JOIN profiles p2 ON p2.id = c.participant_2_id
    WHERE p1.user_id = auth.uid() OR p2.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN profiles p1 ON p1.id = c.participant_1_id
      JOIN profiles p2 ON p2.id = c.participant_2_id
      WHERE p1.user_id = auth.uid() OR p2.user_id = auth.uid()
    )
    AND sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE TO authenticated
  USING (receiver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 3.16 DEMO VIEWS POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert demo views" ON demo_views;
CREATE POLICY "Anyone can insert demo views"
  ON demo_views FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own demo views" ON demo_views;
CREATE POLICY "Users can view own demo views"
  ON demo_views FOR SELECT TO authenticated
  USING (viewer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Project owners can view all views for their projects" ON demo_views;
CREATE POLICY "Project owners can view all views for their projects"
  ON demo_views FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE pr.user_id = auth.uid()
  ));